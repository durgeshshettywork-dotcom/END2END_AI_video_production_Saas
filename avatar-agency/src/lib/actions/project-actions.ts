"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ProjectStatus } from "@prisma/client";
import { isValidTransition, validateTransition, canCancel } from "@/lib/status-machine";
import { onProjectCreated, onScriptApproved, onScriptRejected, onVideoApprovedWithEditor, onVideoRejected } from "@/lib/services/webhook-orchestrator";

const createProjectSchema = z.object({
  videoIdea: z.string().min(10, "Video idea must be at least 10 characters"),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  clientId: z.string().min(1, "Client is required"),
  editorId: z.string().optional(),
});

const updateProjectSchema = z.object({
  videoIdea: z.string().min(10, "Video idea must be at least 10 characters").optional(),
  deadline: z.string().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date").optional(),
  editorId: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  scriptFeedback: z.string().optional(),
});

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createProject(formData: FormData): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = createProjectSchema.safeParse({
    videoIdea: formData.get("videoIdea"),
    deadline: formData.get("deadline"),
    clientId: formData.get("clientId"),
    editorId: formData.get("editorId") || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { videoIdea, deadline, clientId, editorId } = validatedFields.data;

  // Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  // Verify editor exists if provided
  if (editorId) {
    const editor = await prisma.user.findUnique({
      where: { id: editorId },
    });

    if (!editor) {
      return { success: false, error: "Editor not found" };
    }
  }

  const project = await prisma.project.create({
    data: {
      videoIdea,
      deadline: new Date(deadline),
      clientId,
      editorId: editorId || null,
      status: "CREATED",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "PROJECT_CREATED",
      projectId: project.id,
      userId: session.user.id,
      details: JSON.stringify({ videoIdea }),
    },
  });

  // Trigger research webhook (starts the automated pipeline)
  const webhookResult = await onProjectCreated(project.id);

  if (!webhookResult.success) {
    console.error("Failed to trigger research webhook:", webhookResult.error);
    // Project is created but webhook failed - admin can retry from UI
  }

  revalidatePath("/dashboard/projects");
  redirect(`/dashboard/projects/${project.id}`);
}

export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Editors can only update projects assigned to them
  if (session.user.role !== "ADMIN" && project.editorId !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = updateProjectSchema.safeParse({
    videoIdea: formData.get("videoIdea") || undefined,
    deadline: formData.get("deadline") || undefined,
    editorId: formData.get("editorId") || undefined,
    status: formData.get("status") || undefined,
    scriptFeedback: formData.get("scriptFeedback") || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { videoIdea, deadline, editorId, status, scriptFeedback } = validatedFields.data;

  const updateData: {
    videoIdea?: string;
    deadline?: Date;
    editorId?: string | null;
    status?: ProjectStatus;
    scriptFeedback?: string | null;
  } = {};

  if (videoIdea) updateData.videoIdea = videoIdea;
  if (deadline) updateData.deadline = new Date(deadline);
  if (editorId !== undefined) updateData.editorId = editorId || null;
  if (status) updateData.status = status;
  if (scriptFeedback !== undefined) updateData.scriptFeedback = scriptFeedback || null;

  await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });

  // Log status change
  if (status && status !== project.status) {
    await prisma.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        projectId,
        userId: session.user.id,
        details: { from: project.status, to: status },
      },
    });
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function assignEditor(
  projectId: string,
  editorId: string
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const editor = await prisma.user.findUnique({
    where: { id: editorId },
  });

  if (!editor || editor.role !== "EDITOR") {
    return { success: false, error: "Invalid editor" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { editorId },
  });

  await prisma.activityLog.create({
    data: {
      action: "EDITOR_ASSIGNED",
      projectId,
      userId: session.user.id,
      details: { editorId, editorName: editor.name },
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function approveScript(projectId: string): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  // Atomic status check - prevents race condition
  // Use updateMany with status condition to ensure only one request wins
  const lockResult = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: "SCRIPT_PENDING_APPROVAL",
    },
    data: {
      webhookStatus: "pending", // Mark as being processed
    },
  });

  if (lockResult.count === 0) {
    // Race condition: status already changed by concurrent request
    return {
      success: false,
      error: "Script is not pending approval (may have been already approved/rejected)",
    };
  }

  // Trigger production webhook via orchestrator
  // This handles status update, logging, and webhook trigger
  const result = await onScriptApproved(projectId);

  if (!result.success) {
    // Webhook failed but status was updated - log the error
    console.error("Production webhook failed:", result.error);
    // Don't return error - the project is approved, webhook can be retried
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function rejectScript(
  projectId: string,
  feedback: string
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!feedback || feedback.trim().length === 0) {
    return { success: false, error: "Feedback is required for rejection" };
  }

  // Atomic status check - prevents race condition
  const lockResult = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: "SCRIPT_PENDING_APPROVAL",
    },
    data: {
      webhookStatus: "pending", // Mark as being processed
    },
  });

  if (lockResult.count === 0) {
    // Race condition: status already changed by concurrent request
    return {
      success: false,
      error: "Script is not pending approval (may have been already approved/rejected)",
    };
  }

  // Trigger optimizer webhook via orchestrator
  // This handles status update, feedback storage, logging, and webhook trigger
  const result = await onScriptRejected(projectId, feedback);

  if (!result.success) {
    console.error("Optimizer webhook failed:", result.error);
    // Don't return error - the rejection is recorded, webhook can be retried
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function approveVideo(
  projectId: string,
  editorId: string
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!editorId) {
    return { success: false, error: "Editor must be assigned when approving video" };
  }

  // Verify editor exists first (before atomic lock)
  const editor = await prisma.user.findUnique({
    where: { id: editorId },
  });

  if (!editor || editor.role !== "EDITOR") {
    return { success: false, error: "Invalid editor selected" };
  }

  // Atomic status check - prevents race condition
  const lockResult = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: "PRODUCTION_PENDING_APPROVAL",
    },
    data: {
      webhookStatus: "pending", // Mark as being processed
    },
  });

  if (lockResult.count === 0) {
    // Race condition: status already changed by concurrent request
    return {
      success: false,
      error: "Video is not pending approval (may have been already approved/rejected)",
    };
  }

  // Approve video and assign editor via orchestrator
  // This handles status update, editor assignment, logging, and notification
  const result = await onVideoApprovedWithEditor(projectId, editorId, session.user.id);

  if (!result.success) {
    console.error("Editor notification failed:", result.error);
    // Don't return error - the approval is recorded, notification can be retried
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function rejectVideo(
  projectId: string,
  feedback: string
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!feedback || feedback.trim().length === 0) {
    return { success: false, error: "Feedback is required for rejection" };
  }

  // Atomic status check - prevents race condition
  const lockResult = await prisma.project.updateMany({
    where: {
      id: projectId,
      status: "PRODUCTION_PENDING_APPROVAL",
    },
    data: {
      webhookStatus: "pending", // Mark as being processed
    },
  });

  if (lockResult.count === 0) {
    // Race condition: status already changed by concurrent request
    return {
      success: false,
      error: "Video is not pending approval (may have been already approved/rejected)",
    };
  }

  // Reject video and trigger regeneration via orchestrator
  // This handles status update, feedback storage, logging, and production webhook
  const result = await onVideoRejected(projectId, feedback);

  if (!result.success) {
    console.error("Production webhook (regeneration) failed:", result.error);
    // Don't return error - the rejection is recorded, webhook can be retried
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function submitFinalVideo(
  projectId: string,
  finalVideoUrl: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Only assigned editor or admin can submit
  if (session.user.role !== "ADMIN" && project.editorId !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      finalVideoUrl,
      status: "FINAL_REVIEW",
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "FINAL_SUBMITTED",
      projectId,
      userId: session.user.id,
      details: { finalVideoUrl },
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function completeProject(projectId: string): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Validate status transition
  if (!isValidTransition(project.status, "COMPLETED")) {
    const error = validateTransition(project.status, "COMPLETED");
    return { success: false, error: error || "Invalid status transition" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED" },
  });

  await prisma.activityLog.create({
    data: {
      action: "PROJECT_COMPLETED",
      projectId,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function cancelProject(projectId: string): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Validate that project can be cancelled
  if (!canCancel(project.status)) {
    return {
      success: false,
      error: `Cannot cancel project in '${project.status}' status`,
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "CANCELLED" },
  });

  await prisma.activityLog.create({
    data: {
      action: "PROJECT_CANCELLED",
      projectId,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}
