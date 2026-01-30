"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/lib/actions/project-actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";

type FormState = {
  success: boolean;
  error?: string;
} | null;

interface NewProjectFormProps {
  clients: { id: string; name: string }[];
  editors: { id: string; name: string }[];
}

export function NewProjectForm({ clients, editors }: NewProjectFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await createProject(formData);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Default deadline to 7 days from now
  const defaultDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoIdea">Video Idea / Topic</Label>
        <Input
          id="videoIdea"
          name="videoIdea"
          placeholder="Describe the video topic or idea..."
          required
          minLength={10}
        />
        <p className="text-sm text-muted-foreground">
          Brief description of what the video should be about
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <Select name="clientId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input
          id="deadline"
          name="deadline"
          type="date"
          defaultValue={defaultDeadline}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="editorId">Assign Editor (Optional)</Label>
        <Select name="editorId">
          <SelectTrigger>
            <SelectValue placeholder="Assign later" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Assign later</SelectItem>
            {editors.map((editor) => (
              <SelectItem key={editor.id} value={editor.id}>
                {editor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          You can assign an editor now or wait until the video is ready for editing
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Project
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/projects">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
