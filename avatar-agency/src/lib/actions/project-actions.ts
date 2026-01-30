"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

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
      details: { videoIdea },
    },
  });

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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  if (project.status !== "SCRIPT_PENDING_APPROVAL") {
    return { success: false, error: "Script is not pending approval" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "SCRIPT_APPROVED" },
  });

  await prisma.activityLog.create({
    data: {
      action: "SCRIPT_APPROVED",
      projectId,
      userId: session.user.id,
    },
  });

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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  if (project.status !== "SCRIPT_PENDING_APPROVAL") {
    return { success: false, error: "Script is not pending approval" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "SCRIPT_IN_PROGRESS",
      scriptFeedback: feedback,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "SCRIPT_REJECTED",
      projectId,
      userId: session.user.id,
      details: { feedback },
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);

  return { success: true };
}

export async function approveVideo(projectId: string): Promise<ActionResult> {
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

  if (project.status !== "PRODUCTION_PENDING_APPROVAL") {
    return { success: false, error: "Video is not pending approval" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "PRODUCTION_APPROVED" },
  });

  await prisma.activityLog.create({
    data: {
      action: "VIDEO_APPROVED",
      projectId,
      userId: session.user.id,
    },
  });

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
