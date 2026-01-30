import { prisma } from "@/lib/prisma";

export type WebhookType =
  | "research"
  | "scripting"
  | "optimizer"
  | "production"
  | "notification";

interface WebhookPayload {
  projectId: string;
  clientId: string;
  videoIdea: string;
  clientName: string;
  contentNiche: string;
  avatarId?: string | null;
  voiceId?: string | null;
  brandGuidelinesUrl?: string | null;
  // Additional data depending on webhook type
  script?: string | null;
  scriptFeedback?: string | null;
  researchOutput?: string | null;
}

interface WebhookResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function getWebhookUrl(type: WebhookType): Promise<string | null> {
  // First check database config
  const config = await prisma.webhookConfig.findUnique({
    where: { name: type },
  });

  if (config?.isActive && config.url) {
    return config.url;
  }

  // Fallback to environment variables
  const envMap: Record<WebhookType, string> = {
    research: process.env.WEBHOOK_RESEARCH_URL || "",
    scripting: process.env.WEBHOOK_SCRIPTING_URL || "",
    optimizer: process.env.WEBHOOK_OPTIMIZER_URL || "",
    production: process.env.WEBHOOK_PRODUCTION_URL || "",
    notification: process.env.WEBHOOK_NOTIFICATION_URL || "",
  };

  return envMap[type] || null;
}

export async function getWebhookSecret(type: WebhookType): Promise<string | null> {
  const config = await prisma.webhookConfig.findUnique({
    where: { name: type },
  });

  if (config?.secret) {
    return config.secret;
  }

  return process.env.WEBHOOK_SECRET || null;
}

export async function callWebhook(
  type: WebhookType,
  payload: WebhookPayload
): Promise<WebhookResponse> {
  const url = await getWebhookUrl(type);

  if (!url) {
    return { success: false, error: `No URL configured for ${type} webhook` };
  }

  const secret = await getWebhookSecret(type);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (secret) {
      headers["X-Webhook-Secret"] = secret;
    }

    // Log webhook call
    await prisma.activityLog.create({
      data: {
        action: "WEBHOOK_CALLED",
        projectId: payload.projectId,
        details: { type, url: url.substring(0, 50) + "..." },
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Log failure
      await prisma.activityLog.create({
        data: {
          action: "WEBHOOK_FAILED",
          projectId: payload.projectId,
          details: { type, status: response.status, error: errorText.substring(0, 200) },
        },
      });

      // Update project webhook status
      await prisma.project.update({
        where: { id: payload.projectId },
        data: {
          webhookStatus: "error",
          webhookError: `${type}: ${response.status} - ${errorText.substring(0, 200)}`,
        },
      });

      return {
        success: false,
        error: `Webhook returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json().catch(() => ({}));

    // Log success
    await prisma.activityLog.create({
      data: {
        action: "WEBHOOK_SUCCESS",
        projectId: payload.projectId,
        details: { type },
      },
    });

    // Update project webhook status
    await prisma.project.update({
      where: { id: payload.projectId },
      data: {
        webhookStatus: "success",
        webhookError: null,
      },
    });

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log failure
    await prisma.activityLog.create({
      data: {
        action: "WEBHOOK_FAILED",
        projectId: payload.projectId,
        details: { type, error: errorMessage },
      },
    });

    // Update project webhook status
    await prisma.project.update({
      where: { id: payload.projectId },
      data: {
        webhookStatus: "error",
        webhookError: `${type}: ${errorMessage}`,
      },
    });

    return { success: false, error: errorMessage };
  }
}

export async function triggerResearchWebhook(projectId: string): Promise<WebhookResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  return callWebhook("research", {
    projectId: project.id,
    clientId: project.clientId,
    videoIdea: project.videoIdea,
    clientName: project.client.name,
    contentNiche: project.client.contentNiche,
    brandGuidelinesUrl: project.client.brandGuidelinesUrl,
  });
}

export async function triggerScriptingWebhook(projectId: string): Promise<WebhookResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  return callWebhook("scripting", {
    projectId: project.id,
    clientId: project.clientId,
    videoIdea: project.videoIdea,
    clientName: project.client.name,
    contentNiche: project.client.contentNiche,
    researchOutput: project.researchOutput,
    brandGuidelinesUrl: project.client.brandGuidelinesUrl,
  });
}

export async function triggerOptimizerWebhook(projectId: string): Promise<WebhookResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  return callWebhook("optimizer", {
    projectId: project.id,
    clientId: project.clientId,
    videoIdea: project.videoIdea,
    clientName: project.client.name,
    contentNiche: project.client.contentNiche,
    script: project.script,
    scriptFeedback: project.scriptFeedback,
  });
}

export async function triggerProductionWebhook(projectId: string): Promise<WebhookResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  return callWebhook("production", {
    projectId: project.id,
    clientId: project.clientId,
    videoIdea: project.videoIdea,
    clientName: project.client.name,
    contentNiche: project.client.contentNiche,
    script: project.script,
    avatarId: project.client.avatarId,
    voiceId: project.client.voiceId,
  });
}

export async function triggerNotificationWebhook(
  projectId: string,
  notificationType: string,
  message: string
): Promise<WebhookResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true, editor: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  return callWebhook("notification", {
    projectId: project.id,
    clientId: project.clientId,
    videoIdea: project.videoIdea,
    clientName: project.client.name,
    contentNiche: project.client.contentNiche,
    // @ts-expect-error - additional notification fields
    notificationType,
    message,
    editorName: project.editor?.name,
    editorEmail: project.editor?.email,
  });
}
