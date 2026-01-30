import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";

// Verify webhook secret
async function verifyWebhookSecret(request: Request): Promise<boolean> {
  const secret = request.headers.get("X-Webhook-Secret");
  const envSecret = process.env.WEBHOOK_SECRET;

  if (!envSecret) {
    // No secret configured, allow all requests (not recommended for production)
    return true;
  }

  return secret === envSecret;
}

export async function POST(request: Request) {
  // Verify webhook secret
  if (!(await verifyWebhookSecret(request))) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  const body = await request.json();
  const { type, projectId, ...data } = body;

  if (!type || !projectId) {
    return NextResponse.json(
      { error: "type and projectId are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    switch (type) {
      case "research_complete": {
        // Research agent completed
        await prisma.project.update({
          where: { id: projectId },
          data: {
            researchOutput: data.researchOutput || data.output || data.result,
            status: "RESEARCH_COMPLETE" as ProjectStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "RESEARCH_COMPLETE", source: "webhook" },
          },
        });

        break;
      }

      case "script_complete": {
        // Scripting agent completed
        await prisma.project.update({
          where: { id: projectId },
          data: {
            script: data.script || data.output || data.result,
            status: "SCRIPT_PENDING_APPROVAL" as ProjectStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "SCRIPT_PENDING_APPROVAL", source: "webhook" },
          },
        });

        break;
      }

      case "script_optimized": {
        // Script optimizer completed (after feedback)
        await prisma.project.update({
          where: { id: projectId },
          data: {
            script: data.script || data.output || data.result,
            scriptFeedback: null, // Clear the feedback
            status: "SCRIPT_PENDING_APPROVAL" as ProjectStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "SCRIPT_PENDING_APPROVAL", source: "webhook", optimized: true },
          },
        });

        break;
      }

      case "video_complete": {
        // Video production completed (HeyGen)
        await prisma.project.update({
          where: { id: projectId },
          data: {
            rawVideoUrl: data.videoUrl || data.rawVideoUrl || data.url,
            status: "PRODUCTION_PENDING_APPROVAL" as ProjectStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "PRODUCTION_PENDING_APPROVAL", source: "webhook" },
          },
        });

        break;
      }

      case "error": {
        // Webhook reported an error
        await prisma.project.update({
          where: { id: projectId },
          data: {
            webhookStatus: "error",
            webhookError: data.error || data.message || "Unknown error from webhook",
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "WEBHOOK_FAILED",
            projectId,
            details: { error: data.error || data.message, source: data.source },
          },
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown callback type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
