import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebhookConfigForm } from "./webhook-form";

const webhookTypes = [
  {
    name: "research",
    label: "Research Agent",
    description: "Triggered when a new project is created. Performs topic research.",
  },
  {
    name: "scripting",
    label: "Scripting Agent",
    description: "Triggered after research is complete. Generates the video script.",
  },
  {
    name: "optimizer",
    label: "Script Optimizer",
    description: "Triggered when script needs revision based on feedback.",
  },
  {
    name: "production",
    label: "Video Production (HeyGen)",
    description: "Triggered after script approval. Generates the AI avatar video.",
  },
  {
    name: "notification",
    label: "Notifications",
    description: "Sends notifications for project status changes.",
  },
];

export default async function SettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const configs = await prisma.webhookConfig.findMany();
  const configMap = new Map(configs.map((c) => [c.name, c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure webhooks and integrations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>N8N Webhook Configuration</CardTitle>
          <CardDescription>
            Configure the webhook URLs for each automation agent. These connect to your N8N workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {webhookTypes.map((webhook) => {
            const config = configMap.get(webhook.name);
            return (
              <WebhookConfigForm
                key={webhook.name}
                name={webhook.name}
                label={webhook.label}
                description={webhook.description}
                currentUrl={config?.url || ""}
                currentSecret={config?.secret || ""}
                isActive={config?.isActive ?? true}
              />
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Alternatively, you can configure webhooks via environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-mono bg-muted p-4 rounded-lg space-y-1">
            <p>WEBHOOK_RESEARCH_URL=https://your-n8n-instance/webhook/...</p>
            <p>WEBHOOK_SCRIPTING_URL=https://your-n8n-instance/webhook/...</p>
            <p>WEBHOOK_OPTIMIZER_URL=https://your-n8n-instance/webhook/...</p>
            <p>WEBHOOK_PRODUCTION_URL=https://your-n8n-instance/webhook/...</p>
            <p>WEBHOOK_NOTIFICATION_URL=https://your-n8n-instance/webhook/...</p>
            <p>WEBHOOK_SECRET=your-secret-key</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Database configuration takes precedence over environment variables.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
