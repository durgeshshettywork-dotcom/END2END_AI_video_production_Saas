/**
 * Webhook Orchestrator
 *
 * This module centralizes all webhook triggering logic for the project workflow.
 * It defines WHEN webhooks should fire and handles the cascading logic.
 *
 * Key Responsibilities:
 * 1. Trigger webhooks automatically based on status transitions
 * 2. Handle the response and update project status accordingly
 * 3. Manage error states without breaking the flow
 *
 * Webhook Flow:
 * - Project Created → Research Webhook
 * - Research Complete → Scripting Webhook
 * - Script Rejected → Optimizer Webhook
 * - Script Approved → Production Webhook
 * - Key Events → Notification Webhook
 */

import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import {
  triggerResearchWebhook,
  triggerScriptingWebhook,
  triggerOptimizerWebhook,
  triggerProductionWebhook,
  triggerNotificationWebhook,
  WebhookType,
} from "./webhook";

export interface WebhookResult {
  success: boolean;
  webhookType: WebhookType;
  error?: string;
}

/**
 * Trigger the appropriate webhook after a project is created.
 * This kicks off the entire automated pipeline.
 *
 * Flow: CREATED → RESEARCH_IN_PROGRESS (research webhook fires)
 */
export async function onProjectCreated(projectId: string): Promise<WebhookResult> {
  // Update status to indicate research is starting
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "RESEARCH_IN_PROGRESS",
      webhookStatus: "pending",
    },
  });

  // Log the status change
  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      projectId,
      details: JSON.stringify({
        from: "CREATED",
        to: "RESEARCH_IN_PROGRESS",
        trigger: "auto_webhook",
      }),
    },
  });

  // Trigger research webhook
  const result = await triggerResearchWebhook(projectId);

  return {
    success: result.success,
    webhookType: "research",
    error: result.error,
  };
}

/**
 * Handle when research webhook completes successfully.
 * Automatically triggers the scripting webhook.
 *
 * Flow: RESEARCH_COMPLETE → SCRIPT_IN_PROGRESS (scripting webhook fires)
 */
export async function onResearchComplete(projectId: string): Promise<WebhookResult> {
  // Update status to indicate scripting is starting
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "SCRIPT_IN_PROGRESS",
      webhookStatus: "pending",
    },
  });

  // Log the status change
  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      projectId,
      details: JSON.stringify({
        from: "RESEARCH_COMPLETE",
        to: "SCRIPT_IN_PROGRESS",
        trigger: "auto_webhook",
      }),
    },
  });

  // Trigger scripting webhook
  const result = await triggerScriptingWebhook(projectId);

  return {
    success: result.success,
    webhookType: "scripting",
    error: result.error,
  };
}

/**
 * Handle when admin rejects a script with feedback.
 * Triggers the optimizer webhook to improve the script.
 *
 * Flow: SCRIPT_PENDING_APPROVAL → SCRIPT_IN_PROGRESS (optimizer webhook fires)
 */
export async function onScriptRejected(
  projectId: string,
  feedback: string
): Promise<WebhookResult> {
  // Update status and store feedback
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "SCRIPT_IN_PROGRESS",
      scriptFeedback: feedback,
      webhookStatus: "pending",
    },
  });

  // Log the rejection
  await prisma.activityLog.create({
    data: {
      action: "SCRIPT_REJECTED",
      projectId,
      details: JSON.stringify({ feedback, trigger: "admin_action" }),
    },
  });

  // Trigger optimizer webhook
  const result = await triggerOptimizerWebhook(projectId);

  return {
    success: result.success,
    webhookType: "optimizer",
    error: result.error,
  };
}

/**
 * Handle when admin approves a script.
 * Triggers the production webhook to generate the AI video.
 *
 * Flow: SCRIPT_PENDING_APPROVAL → SCRIPT_APPROVED → PRODUCTION_IN_PROGRESS
 */
export async function onScriptApproved(projectId: string): Promise<WebhookResult> {
  // Update status to approved, then immediately to production in progress
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "PRODUCTION_IN_PROGRESS",
      webhookStatus: "pending",
    },
  });

  // Log both status changes
  await prisma.activityLog.create({
    data: {
      action: "SCRIPT_APPROVED",
      projectId,
      details: JSON.stringify({ trigger: "admin_action" }),
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "STATUS_CHANGED",
      projectId,
      details: JSON.stringify({
        from: "SCRIPT_APPROVED",
        to: "PRODUCTION_IN_PROGRESS",
        trigger: "auto_webhook",
      }),
    },
  });

  // Trigger production webhook
  const result = await triggerProductionWebhook(projectId);

  return {
    success: result.success,
    webhookType: "production",
    error: result.error,
  };
}

/**
 * Handle when admin rejects a raw video.
 * Re-triggers the production webhook to regenerate.
 *
 * Flow: PRODUCTION_PENDING_APPROVAL → PRODUCTION_IN_PROGRESS (production webhook fires again)
 */
export async function onVideoRejected(
  projectId: string,
  feedback: string
): Promise<WebhookResult> {
  // Store rejection feedback and reset status
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "PRODUCTION_IN_PROGRESS",
      scriptFeedback: feedback, // Reusing this field for video feedback
      webhookStatus: "pending",
    },
  });

  // Log the rejection
  await prisma.activityLog.create({
    data: {
      action: "VIDEO_REJECTED",
      projectId,
      details: JSON.stringify({ feedback, trigger: "admin_action" }),
    },
  });

  // Re-trigger production webhook
  const result = await triggerProductionWebhook(projectId);

  return {
    success: result.success,
    webhookType: "production",
    error: result.error,
  };
}

/**
 * Handle when admin approves a raw video and assigns an editor.
 * Sends notification to the editor.
 *
 * Flow: PRODUCTION_PENDING_APPROVAL → EDITING_ASSIGNED (notification fires)
 */
export async function onVideoApprovedWithEditor(
  projectId: string,
  editorId: string,
  adminId: string
): Promise<WebhookResult> {
  // Get editor info for notification
  const editor = await prisma.user.findUnique({
    where: { id: editorId },
    select: { name: true, email: true },
  });

  if (!editor) {
    return {
      success: false,
      webhookType: "notification",
      error: "Editor not found",
    };
  }

  // Update project with editor assignment
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "EDITING_ASSIGNED",
      editorId,
      webhookStatus: "pending",
    },
  });

  // Log the approval and assignment
  await prisma.activityLog.create({
    data: {
      action: "VIDEO_APPROVED",
      projectId,
      userId: adminId,
      details: JSON.stringify({ trigger: "admin_action" }),
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "EDITOR_ASSIGNED",
      projectId,
      userId: adminId,
      details: JSON.stringify({
        editorId,
        editorName: editor.name,
      }),
    },
  });

  // Send notification to editor
  const result = await triggerNotificationWebhook(
    projectId,
    "editor_assigned",
    `You have been assigned a new video project. Please check your dashboard.`
  );

  return {
    success: result.success,
    webhookType: "notification",
    error: result.error,
  };
}

/**
 * Send a notification for any significant event.
 * This is a utility function for various notification needs.
 */
export async function sendNotification(
  projectId: string,
  notificationType: string,
  message: string
): Promise<WebhookResult> {
  const result = await triggerNotificationWebhook(projectId, notificationType, message);

  return {
    success: result.success,
    webhookType: "notification",
    error: result.error,
  };
}

/**
 * Retry a failed webhook for a project.
 * Determines which webhook to retry based on the current status.
 */
export async function retryFailedWebhook(projectId: string): Promise<WebhookResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, webhookStatus: true },
  });

  if (!project) {
    return {
      success: false,
      webhookType: "research",
      error: "Project not found",
    };
  }

  if (project.webhookStatus !== "error") {
    return {
      success: false,
      webhookType: "research",
      error: "No failed webhook to retry",
    };
  }

  // Log the retry attempt
  await prisma.activityLog.create({
    data: {
      action: "WEBHOOK_RETRY",
      projectId,
      details: JSON.stringify({ status: project.status }),
    },
  });

  // Determine which webhook to retry based on current status
  switch (project.status) {
    case "RESEARCH_IN_PROGRESS":
      return {
        ...(await triggerResearchWebhook(projectId)),
        webhookType: "research",
      };

    case "SCRIPT_IN_PROGRESS":
      // Could be scripting or optimizer - check if there's feedback
      const projectWithFeedback = await prisma.project.findUnique({
        where: { id: projectId },
        select: { scriptFeedback: true },
      });
      if (projectWithFeedback?.scriptFeedback) {
        return {
          ...(await triggerOptimizerWebhook(projectId)),
          webhookType: "optimizer",
        };
      }
      return {
        ...(await triggerScriptingWebhook(projectId)),
        webhookType: "scripting",
      };

    case "PRODUCTION_IN_PROGRESS":
      return {
        ...(await triggerProductionWebhook(projectId)),
        webhookType: "production",
      };

    default:
      return {
        success: false,
        webhookType: "research",
        error: `Cannot retry webhook in '${project.status}' status`,
      };
  }
}
