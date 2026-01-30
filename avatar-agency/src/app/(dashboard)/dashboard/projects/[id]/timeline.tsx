"use client";

import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date;
  user: { name: string } | null;
}

interface ProjectTimelineProps {
  activities: Activity[];
}

const actionLabels: Record<string, string> = {
  PROJECT_CREATED: "Project created",
  STATUS_CHANGED: "Status changed",
  SCRIPT_APPROVED: "Script approved",
  SCRIPT_REJECTED: "Script changes requested",
  VIDEO_APPROVED: "Video approved",
  VIDEO_REJECTED: "Video changes requested",
  EDITOR_ASSIGNED: "Editor assigned",
  FINAL_SUBMITTED: "Final video submitted",
  FEEDBACK_SENT: "Feedback sent",
  PROJECT_COMPLETED: "Project completed",
  PROJECT_CANCELLED: "Project cancelled",
  WEBHOOK_CALLED: "Webhook triggered",
  WEBHOOK_SUCCESS: "Webhook succeeded",
  WEBHOOK_FAILED: "Webhook failed",
  WEBHOOK_RETRY: "Webhook retried",
};

export function ProjectTimeline({ activities }: ProjectTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="relative">
          {index !== activities.length - 1 && (
            <div className="absolute left-2 top-6 bottom-0 w-px bg-border" />
          )}
          <div className="flex gap-3">
            <div className="w-4 h-4 rounded-full bg-primary mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {actionLabels[activity.action] || activity.action}
              </p>
              {activity.user && (
                <p className="text-xs text-muted-foreground">
                  by {activity.user.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
