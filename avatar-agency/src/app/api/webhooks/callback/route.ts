import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { onResearchComplete } from "@/lib/services/webhook-orchestrator";
import { validateWebhookPayload } from "@/lib/validation/webhook-schemas";
import { isValidTransition } from "@/lib/status-machine";

/**
 * Verify webhook secret (REQUIRED)
 *
 * Security: FAILS CLOSED - if no secret is configured, all requests are rejected.
 * Uses constant-time comparison to prevent timing attacks.
 */
function verifyWebhookSecret(request: Request): { valid: boolean; error?: string } {
  const secret = request.headers.get("X-Webhook-Secret");
  const envSecret = process.env.WEBHOOK_SECRET;

  // SECURITY: Require secret to be configured (fail closed)
  if (!envSecret) {
    console.error("SECURITY: WEBHOOK_SECRET environment variable not configured");
    return {
      valid: false,
      error: "Server misconfiguration: webhook secret not set",
    };
  }

  if (!secret) {
    return {
      valid: false,
      error: "Missing X-Webhook-Secret header",
    };
  }

  // Constant-time comparison to prevent timing attacks
  if (secret.length !== envSecret.length) {
    return { valid: false, error: "Invalid webhook secret" };
  }

  let result = 0;
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ envSecret.charCodeAt(i);
  }

  if (result !== 0) {
    return { valid: false, error: "Invalid webhook secret" };
  }

  return { valid: true };
}

/**
 * Extract request metadata for logging
 */
function getRequestMetadata(request: Request): Record<string, string> {
  return {
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const metadata = getRequestMetadata(request);

  // 1. Verify webhook secret (REQUIRED)
  const secretCheck = verifyWebhookSecret(request);
  if (!secretCheck.valid) {
    console.warn("Webhook auth failed:", { ...metadata, reason: secretCheck.error });
    return NextResponse.json({ error: secretCheck.error }, { status: 401 });
  }

  // 2. Parse JSON body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    console.warn("Webhook invalid JSON:", metadata);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 3. Validate payload structure with Zod
  const validation = validateWebhookPayload(rawBody);
  if (!validation.success) {
    console.warn("Webhook validation failed:", { ...metadata, error: validation.error });
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const validatedData = validation.data;
  const { type, projectId } = validatedData;

  // 4. Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    console.warn("Webhook project not found:", { ...metadata, projectId });
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Log the incoming callback
  console.info("Webhook callback received:", {
    ...metadata,
    type,
    projectId,
    currentStatus: project.status,
  });

  try {
    switch (validatedData.type) {
      case "research_complete": {
        // Research agent completed - store output and trigger scripting
        const researchOutput = validatedData.researchOutput || validatedData.output || validatedData.result;

        // Validate status transition
        const targetStatus: ProjectStatus = "RESEARCH_COMPLETE";
        if (!isValidTransition(project.status, targetStatus)) {
          console.warn(`Invalid transition attempt: ${project.status} -> ${targetStatus}`, { projectId, ip: metadata.ip });
          return NextResponse.json(
            { error: `Cannot transition from ${project.status} to ${targetStatus}` },
            { status: 400 }
          );
        }

        await prisma.project.update({
          where: { id: projectId },
          data: {
            researchOutput,
            status: targetStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "RESEARCH_COMPLETE", source: "webhook", ip: metadata.ip },
          },
        });

        // Automatically trigger scripting webhook (HOOK-02)
        const scriptingResult = await onResearchComplete(projectId);

        if (!scriptingResult.success) {
          console.error("Failed to trigger scripting webhook:", scriptingResult.error);
          // Research is complete but scripting webhook failed - admin can retry from UI
        }

        break;
      }

      case "script_complete": {
        // Scripting agent completed - waiting for admin approval
        const script = validatedData.script || validatedData.output || validatedData.result;

        // Validate status transition
        const targetStatus: ProjectStatus = "SCRIPT_PENDING_APPROVAL";
        if (!isValidTransition(project.status, targetStatus)) {
          console.warn(`Invalid transition attempt: ${project.status} -> ${targetStatus}`, { projectId, ip: metadata.ip });
          return NextResponse.json(
            { error: `Cannot transition from ${project.status} to ${targetStatus}` },
            { status: 400 }
          );
        }

        await prisma.project.update({
          where: { id: projectId },
          data: {
            script,
            status: targetStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "SCRIPT_PENDING_APPROVAL", source: "webhook", ip: metadata.ip },
          },
        });

        break;
      }

      case "script_optimized": {
        // Script optimizer completed (after feedback) - waiting for admin approval
        const script = validatedData.script || validatedData.output || validatedData.result;

        // Validate status transition
        const targetStatus: ProjectStatus = "SCRIPT_PENDING_APPROVAL";
        if (!isValidTransition(project.status, targetStatus)) {
          console.warn(`Invalid transition attempt: ${project.status} -> ${targetStatus}`, { projectId, ip: metadata.ip });
          return NextResponse.json(
            { error: `Cannot transition from ${project.status} to ${targetStatus}` },
            { status: 400 }
          );
        }

        await prisma.project.update({
          where: { id: projectId },
          data: {
            script,
            scriptFeedback: null, // Clear the feedback
            status: targetStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "SCRIPT_PENDING_APPROVAL", source: "webhook", optimized: true, ip: metadata.ip },
          },
        });

        break;
      }

      case "video_complete": {
        // Video production completed (HeyGen) - waiting for admin approval
        const rawVideoUrl = validatedData.videoUrl || validatedData.rawVideoUrl || validatedData.url;

        // Validate status transition
        const targetStatus: ProjectStatus = "PRODUCTION_PENDING_APPROVAL";
        if (!isValidTransition(project.status, targetStatus)) {
          console.warn(`Invalid transition attempt: ${project.status} -> ${targetStatus}`, { projectId, ip: metadata.ip });
          return NextResponse.json(
            { error: `Cannot transition from ${project.status} to ${targetStatus}` },
            { status: 400 }
          );
        }

        await prisma.project.update({
          where: { id: projectId },
          data: {
            rawVideoUrl,
            status: targetStatus,
            webhookStatus: "success",
            webhookError: null,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "STATUS_CHANGED",
            projectId,
            details: { from: project.status, to: "PRODUCTION_PENDING_APPROVAL", source: "webhook", ip: metadata.ip },
          },
        });

        break;
      }

      case "error": {
        // Webhook reported an error
        const errorMessage = validatedData.error || validatedData.message || "Unknown error from webhook";

        await prisma.project.update({
          where: { id: projectId },
          data: {
            webhookStatus: "error",
            webhookError: errorMessage,
          },
        });

        await prisma.activityLog.create({
          data: {
            action: "WEBHOOK_FAILED",
            projectId,
            details: { error: errorMessage, source: validatedData.source, ip: metadata.ip },
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
