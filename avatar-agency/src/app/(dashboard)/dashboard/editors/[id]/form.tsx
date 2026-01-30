"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser, deleteUser } from "@/lib/actions/user-actions";
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

interface EditUserFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EDITOR";
  };
  isCurrentUser: boolean;
}

export function EditUserForm({ user, isCurrentUser }: EditUserFormProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      const result = await updateUser(user.id, formData);
      return result;
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("User updated successfully");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteUser(user.id);

    if (result.success) {
      toast.success("User deleted successfully");
      router.push("/dashboard/editors");
    } else {
      toast.error(result.error || "Failed to delete user");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={user.name}
          placeholder="Enter name"
          required
          minLength={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email}
          placeholder="user@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New Password (optional)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Leave blank to keep current"
          minLength={6}
        />
        <p className="text-sm text-muted-foreground">
          Only fill this if you want to change the password
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/editors">Cancel</Link>
          </Button>
        </div>

        {!isCurrentUser && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" type="button">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {user.name}? This action cannot
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
        )}
      </div>
    </form>
  );
}
