"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClient, deleteClient } from "@/lib/actions/client-actions";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FormState = {
  success: boolean;
  error?: string;
} | null;

interface EditClientFormProps {
  client: {
    id: string;
    name: string;
    contentNiche: string;
    avatarId: string;
    voiceId: string;
    brandGuidelinesUrl: string;
    editingGuidelinesUrl: string;
  };
  hasProjects: boolean;
}

export function EditClientForm({ client, hasProjects }: EditClientFormProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await updateClient(client.id, formData);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Client updated successfully");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteClient(client.id);

    if (result.success) {
      toast.success("Client deleted successfully");
      router.push("/dashboard/clients");
    } else {
      toast.error(result.error || "Failed to delete client");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={client.name}
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
          defaultValue={client.contentNiche}
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
            defaultValue={client.avatarId}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voiceId">Voice ID (HeyGen)</Label>
          <Input
            id="voiceId"
            name="voiceId"
            defaultValue={client.voiceId}
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
          defaultValue={client.brandGuidelinesUrl}
          placeholder="https://drive.google.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="editingGuidelinesUrl">Editing Guidelines URL</Label>
        <Input
          id="editingGuidelinesUrl"
          name="editingGuidelinesUrl"
          type="url"
          defaultValue={client.editingGuidelinesUrl}
          placeholder="https://drive.google.com/..."
        />
      </div>

      <div className="flex justify-between pt-4">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/clients">Cancel</Link>
          </Button>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" type="button" disabled={hasProjects}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {client.name}? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {hasProjects && (
        <p className="text-sm text-muted-foreground">
          This client cannot be deleted because they have active projects.
        </p>
      )}
    </form>
  );
}
