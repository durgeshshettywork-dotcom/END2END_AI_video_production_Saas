"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/actions/client-actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";

type FormState = {
  success: boolean;
  error?: string;
} | null;

export function NewClientForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await createClient(formData);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter client name"
          required
          minLength={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contentNiche">Content Niche</Label>
        <Input
          id="contentNiche"
          name="contentNiche"
          placeholder="e.g., Technology, Finance, Health"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="avatarId">Avatar ID (HeyGen)</Label>
          <Input
            id="avatarId"
            name="avatarId"
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voiceId">Voice ID (HeyGen)</Label>
          <Input
            id="voiceId"
            name="voiceId"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandGuidelinesUrl">Brand Guidelines URL</Label>
        <Input
          id="brandGuidelinesUrl"
          name="brandGuidelinesUrl"
          type="url"
          placeholder="https://drive.google.com/..."
        />
        <p className="text-sm text-muted-foreground">
          Link to Google Drive or similar with brand guidelines
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="editingGuidelinesUrl">Editing Guidelines URL</Label>
        <Input
          id="editingGuidelinesUrl"
          name="editingGuidelinesUrl"
          type="url"
          placeholder="https://drive.google.com/..."
        />
        <p className="text-sm text-muted-foreground">
          Link to Google Drive or similar with editing guidelines
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Client
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/clients">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
