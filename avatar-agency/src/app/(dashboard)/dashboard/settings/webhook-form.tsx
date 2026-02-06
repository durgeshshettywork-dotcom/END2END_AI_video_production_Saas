"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WebhookConfigFormProps {
  name: string;
  label: string;
  description: string;
  currentUrl: string;
  isActive: boolean;
}

export function WebhookConfigForm({
  name,
  label,
  description,
  currentUrl,
  isActive: initialIsActive,
}: WebhookConfigFormProps) {
  const [url, setUrl] = useState(currentUrl);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/webhooks/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, isActive }),
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

      <div className="space-y-2">
        <Label htmlFor={`${name}-url`}>Webhook URL</Label>
        <Input
          id={`${name}-url`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-n8n-instance/webhook/..."
          type="url"
        />
        <p className="text-xs text-muted-foreground">
          Secret authentication is configured via the WEBHOOK_SECRET environment variable
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <p className="text-xs text-muted-foreground">
          Test your webhooks using external tools like curl or Postman
        </p>
      </div>
    </div>
  );
}
