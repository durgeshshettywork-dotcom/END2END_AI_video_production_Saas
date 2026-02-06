import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryFailedWebhook } from "@/lib/services/webhook-orchestrator";
import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/retry
 *
 * Retries a failed webhook for a project.
 * Only admins can retry webhooks.
 * Increments retry count and logs the attempt.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  // Get project to check if it exists and has a failed webhook
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      webhookStatus: true,
      webhookError: true,
      retryCount: true,
      lastWebhookType: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.webhookStatus !== "error") {
    return NextResponse.json(
      { error: "No failed webhook to retry" },
      { status: 400 }
    );
  }

  // Increment retry count before attempting
  await prisma.project.update({
    where: { id: projectId },
    data: {
      retryCount: { increment: 1 },
      webhookStatus: "pending",
      webhookError: null,
    },
  });

  // Attempt the retry
  const result = await retryFailedWebhook(projectId);

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: `${result.webhookType} webhook retried successfully`,
      webhookType: result.webhookType,
      retryCount: project.retryCount + 1,
    });
  } else {
    return NextResponse.json({
      success: false,
      error: result.error,
      webhookType: result.webhookType,
      retryCount: project.retryCount + 1,
    });
  }
}
