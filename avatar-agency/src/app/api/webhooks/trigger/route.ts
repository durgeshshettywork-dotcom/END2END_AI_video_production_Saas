import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  triggerResearchWebhook,
  triggerScriptingWebhook,
  triggerOptimizerWebhook,
  triggerProductionWebhook,
  WebhookType,
} from "@/lib/services/webhook";
import { ProjectStatus } from "@prisma/client";

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, webhookType } = body;

  if (!projectId || !webhookType) {
    return NextResponse.json(
      { error: "projectId and webhookType are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Update status based on webhook type
  const statusUpdates: Record<WebhookType, ProjectStatus> = {
    research: "RESEARCH_IN_PROGRESS",
    scripting: "SCRIPT_IN_PROGRESS",
    optimizer: "SCRIPT_IN_PROGRESS",
    production: "PRODUCTION_IN_PROGRESS",
    notification: project.status as ProjectStatus, // No status change
  };

  // Update project status before triggering
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: statusUpdates[webhookType as WebhookType],
      webhookStatus: "pending",
      webhookError: null,
    },
  });

  // Log status change
  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      projectId,
      userId: session.user.id,
      details: { from: project.status, to: statusUpdates[webhookType as WebhookType] },
    },
  });

  // Trigger the appropriate webhook
  let result;
  switch (webhookType) {
    case "research":
      result = await triggerResearchWebhook(projectId);
      break;
    case "scripting":
      result = await triggerScriptingWebhook(projectId);
      break;
    case "optimizer":
      result = await triggerOptimizerWebhook(projectId);
      break;
    case "production":
      result = await triggerProductionWebhook(projectId);
      break;
    default:
      return NextResponse.json(
        { error: "Invalid webhook type" },
        { status: 400 }
      );
  }

  if (result.success) {
    return NextResponse.json({ success: true, data: result.data });
  } else {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 200 }
    );
  }
}
