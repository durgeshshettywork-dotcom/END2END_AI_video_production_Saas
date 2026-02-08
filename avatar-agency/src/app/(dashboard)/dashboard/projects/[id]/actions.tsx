"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  assignEditor,
  approveScript,
  rejectScript,
  approveVideo,
  rejectVideo,
  submitFinalVideo,
  completeProject,
  cancelProject,
} from "@/lib/actions/project-actions";
import { Loader2, Check, X, Upload, UserPlus, Play, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface ProjectActionsProps {
  project: {
    id: string;
    status: string;
    editorId: string | null;
    script: string | null;
    rawVideoUrl: string | null;
    webhookStatus: string | null;
    webhookError: string | null;
    retryCount: number;
  };
  isAdmin: boolean;
  editors: { id: string; name: string }[];
  currentUserId: string;
}

export function ProjectActions({
  project,
  isAdmin,
  editors,
  currentUserId,
}: ProjectActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [videoApproveDialogOpen, setVideoApproveDialogOpen] = useState(false);
  const [videoRejectDialogOpen, setVideoRejectDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [videoFeedback, setVideoFeedback] = useState("");
  const [finalVideoUrl, setFinalVideoUrl] = useState("");
  const [selectedEditor, setSelectedEditor] = useState("");
  const [selectedVideoEditor, setSelectedVideoEditor] = useState("");

  const handleAction = async (
    action: string,
    fn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setLoading(action);
    try {
      const result = await fn();
      if (result.success) {
        toast.success(`${action} successful`);
      } else {
        toast.error(result.error || `${action} failed`);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleAssignEditor = async () => {
    if (!selectedEditor) return;
    await handleAction("Assign editor", () =>
      assignEditor(project.id, selectedEditor)
    );
    setAssignDialogOpen(false);
    setSelectedEditor("");
  };

  const handleRejectScript = async () => {
    if (!feedback.trim()) return;
    await handleAction("Reject script", () =>
      rejectScript(project.id, feedback)
    );
    setRejectDialogOpen(false);
    setFeedback("");
  };

  const handleSubmitFinal = async () => {
    if (!finalVideoUrl.trim()) return;
    await handleAction("Submit video", () =>
      submitFinalVideo(project.id, finalVideoUrl)
    );
    setSubmitDialogOpen(false);
    setFinalVideoUrl("");
  };

  const handleApproveVideo = async () => {
    if (!selectedVideoEditor) return;
    await handleAction("Approve video", () =>
      approveVideo(project.id, selectedVideoEditor)
    );
    setVideoApproveDialogOpen(false);
    setSelectedVideoEditor("");
  };

  const handleRejectVideo = async () => {
    if (!videoFeedback.trim()) return;
    await handleAction("Reject video", () =>
      rejectVideo(project.id, videoFeedback)
    );
    setVideoRejectDialogOpen(false);
    setVideoFeedback("");
  };

  const isAssignedEditor = project.editorId === currentUserId;

  const triggerWebhook = async (webhookType: string) => {
    setLoading(`webhook-${webhookType}`);
    try {
      const response = await fetch("/api/webhooks/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, webhookType }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`${webhookType} webhook triggered`);
      } else {
        toast.error(data.error || "Failed to trigger webhook");
      }
    } catch {
      toast.error("Failed to trigger webhook");
    } finally {
      setLoading(null);
    }
  };

  const retryWebhook = async () => {
    setLoading("retry-webhook");
    try {
      const response = await fetch("/api/webhooks/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Webhook retried successfully (${data.webhookType})`);
      } else {
        toast.error(data.error || "Failed to retry webhook");
      }
    } catch {
      toast.error("Failed to retry webhook");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Webhook Triggers (Admin only) */}
      {isAdmin && project.status !== "COMPLETED" && project.status !== "CANCELLED" && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Automation</p>

            {/* Start Research - when project is CREATED */}
            {project.status === "CREATED" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => triggerWebhook("research")}
                disabled={loading !== null}
              >
                {loading === "webhook-research" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Research
              </Button>
            )}

            {/* Start Scripting - when research is complete */}
            {project.status === "RESEARCH_COMPLETE" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => triggerWebhook("scripting")}
                disabled={loading !== null}
              >
                {loading === "webhook-scripting" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Generate Script
              </Button>
            )}

            {/* Start Production - when script is approved */}
            {project.status === "SCRIPT_APPROVED" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => triggerWebhook("production")}
                disabled={loading !== null}
              >
                {loading === "webhook-production" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Generate Video (HeyGen)
              </Button>
            )}
          </div>

          {/* Webhook Status */}
          {project.webhookStatus && (
            <div className={`text-xs p-3 rounded-lg ${
              project.webhookStatus === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : project.webhookStatus === "error"
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
            }`}>
              <div className="flex items-center gap-2">
                {project.webhookStatus === "error" && (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <p className="font-medium">
                  Webhook: {project.webhookStatus}
                  {project.retryCount > 0 && (
                    <span className="ml-1 text-xs opacity-75">
                      (retried {project.retryCount}x)
                    </span>
                  )}
                </p>
              </div>
              {project.webhookError && (
                <p className="mt-2 text-xs break-words whitespace-pre-wrap">
                  {project.webhookError}
                </p>
              )}
              {project.webhookStatus === "error" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full bg-white dark:bg-gray-900"
                  onClick={retryWebhook}
                  disabled={loading !== null}
                >
                  {loading === "retry-webhook" ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-3 w-3" />
                  )}
                  Retry Webhook
                </Button>
              )}
            </div>
          )}

          <Separator />
        </>
      )}

      {/* Assign Editor (Admin only, when no editor assigned) */}
      {isAdmin && !project.editorId && (
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Editor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Editor</DialogTitle>
              <DialogDescription>
                Select an editor to assign to this project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedEditor} onValueChange={setSelectedEditor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an editor" />
                </SelectTrigger>
                <SelectContent>
                  {editors.map((editor) => (
                    <SelectItem key={editor.id} value={editor.id}>
                      {editor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignEditor} disabled={!selectedEditor || loading === "Assign editor"}>
                {loading === "Assign editor" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Script Review Actions (Admin only, when script pending) */}
      {isAdmin && project.status === "SCRIPT_PENDING_APPROVAL" && project.script && (
        <>
          <Button
            className="w-full"
            onClick={() => handleAction("Approve script", () => approveScript(project.id))}
            disabled={loading !== null}
          >
            {loading === "Approve script" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Approve Script
          </Button>

          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="destructive">
                <X className="mr-2 h-4 w-4" />
                Request Changes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Script Changes</DialogTitle>
                <DialogDescription>
                  Provide feedback for the script revision
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Input
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What changes are needed?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectScript}
                  disabled={!feedback.trim() || loading === "Reject script"}
                >
                  {loading === "Reject script" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Video Review Actions (Admin only, when video pending) */}
      {isAdmin && project.status === "PRODUCTION_PENDING_APPROVAL" && (
        <div className="space-y-2">
          {/* Approve Video with Editor Assignment */}
          <Dialog open={videoApproveDialogOpen} onOpenChange={setVideoApproveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Check className="mr-2 h-4 w-4" />
                Approve &amp; Assign Editor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Video &amp; Assign Editor</DialogTitle>
                <DialogDescription>
                  Select an editor to work on this video
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="videoEditor">Editor</Label>
                  <Select value={selectedVideoEditor} onValueChange={setSelectedVideoEditor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {editors.map((editor) => (
                        <SelectItem key={editor.id} value={editor.id}>
                          {editor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setVideoApproveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApproveVideo}
                  disabled={!selectedVideoEditor || loading === "Approve video"}
                >
                  {loading === "Approve video" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Approve &amp; Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Video with Feedback */}
          <Dialog open={videoRejectDialogOpen} onOpenChange={setVideoRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <X className="mr-2 h-4 w-4" />
                Request Regeneration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Video Regeneration</DialogTitle>
                <DialogDescription>
                  Provide feedback for improving the video
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="videoFeedback">Feedback</Label>
                  <Input
                    id="videoFeedback"
                    value={videoFeedback}
                    onChange={(e) => setVideoFeedback(e.target.value)}
                    placeholder="Explain what needs to be improved..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setVideoRejectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectVideo}
                  disabled={!videoFeedback.trim() || loading === "Reject video"}
                >
                  {loading === "Reject video" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Submit Final Video (Editor or Admin, when editing) */}
      {(isAdmin || isAssignedEditor) &&
        (project.status === "EDITING_ASSIGNED" ||
          project.status === "EDITING_IN_PROGRESS") && (
          <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Submit Final Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Final Video</DialogTitle>
                <DialogDescription>
                  Enter the URL of the final edited video
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="finalVideoUrl">Video URL</Label>
                  <Input
                    id="finalVideoUrl"
                    value={finalVideoUrl}
                    onChange={(e) => setFinalVideoUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFinal}
                  disabled={!finalVideoUrl.trim() || loading === "Submit video"}
                >
                  {loading === "Submit video" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      {/* Complete Project (Admin only, when in final review) */}
      {isAdmin && project.status === "FINAL_REVIEW" && (
        <Button
          className="w-full"
          onClick={() => handleAction("Complete project", () => completeProject(project.id))}
          disabled={loading !== null}
        >
          {loading === "Complete project" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Mark as Completed
        </Button>
      )}

      {/* Cancel Project (Admin only, if not completed/cancelled) */}
      {isAdmin &&
        project.status !== "COMPLETED" &&
        project.status !== "CANCELLED" && (
          <Button
            className="w-full"
            variant="destructive"
            onClick={() => handleAction("Cancel project", () => cancelProject(project.id))}
            disabled={loading !== null}
          >
            {loading === "Cancel project" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            Cancel Project
          </Button>
        )}

      {/* Status Message */}
      {project.status === "COMPLETED" && (
        <p className="text-center text-sm text-green-600 dark:text-green-400">
          This project has been completed
        </p>
      )}
      {project.status === "CANCELLED" && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          This project has been cancelled
        </p>
      )}
    </div>
  );
}
