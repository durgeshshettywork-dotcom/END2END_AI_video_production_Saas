"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WebhookConfigFormProps {
  name: string;
  label: string;
  description: string;
  currentUrl: string;
  currentSecret: string;
  isActive: boolean;
}

export function WebhookConfigForm({
  name,
  label,
  description,
  currentUrl,
  currentSecret,
  isActive: initialIsActive,
}: WebhookConfigFormProps) {
  const [url, setUrl] = useState(currentUrl);
  const [secret, setSecret] = useState(currentSecret);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, secret, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success(`${label} webhook saved`);
    } catch {
      toast.error("Failed to save webhook configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!url) {
      toast.error("Please enter a webhook URL first");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, secret }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult("success");
        toast.success("Webhook test successful");
      } else {
        setTestResult("error");
        toast.error(data.error || "Webhook test failed");
      }
    } catch {
      setTestResult("error");
      toast.error("Failed to test webhook");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${name}-active`} className="text-sm">
            Active
          </Label>
          <Switch
            id={`${name}-active`}
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${name}-url`}>Webhook URL</Label>
          <Input
            id={`${name}-url`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-n8n-instance/webhook/..."
            type="url"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${name}-secret`}>Secret (Optional)</Label>
          <Input
            id={`${name}-secret`}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Shared secret for authentication"
            type="password"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button
          onClick={handleTest}
          disabled={isTesting || !url}
          variant="outline"
          size="sm"
        >
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
        {testResult === "success" && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
        {testResult === "error" && (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
    </div>
  );
}
