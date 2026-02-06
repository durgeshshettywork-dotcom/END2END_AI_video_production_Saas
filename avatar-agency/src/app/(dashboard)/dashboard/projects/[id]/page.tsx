import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ProjectActions } from "./actions";
import { ProjectTimeline } from "./timeline";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  CREATED: "Created",
  RESEARCH_IN_PROGRESS: "Research In Progress",
  RESEARCH_COMPLETE: "Research Complete",
  SCRIPT_IN_PROGRESS: "Script In Progress",
  SCRIPT_PENDING_APPROVAL: "Script Pending Approval",
  SCRIPT_APPROVED: "Script Approved",
  PRODUCTION_IN_PROGRESS: "Production In Progress",
  PRODUCTION_PENDING_APPROVAL: "Video Pending Approval",
  PRODUCTION_APPROVED: "Video Approved",
  EDITING_ASSIGNED: "Editing Assigned",
  EDITING_IN_PROGRESS: "Editing In Progress",
  FINAL_REVIEW: "Final Review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "outline",
  RESEARCH_IN_PROGRESS: "secondary",
  RESEARCH_COMPLETE: "secondary",
  SCRIPT_IN_PROGRESS: "secondary",
  SCRIPT_PENDING_APPROVAL: "default",
  SCRIPT_APPROVED: "default",
  PRODUCTION_IN_PROGRESS: "secondary",
  PRODUCTION_PENDING_APPROVAL: "default",
  PRODUCTION_APPROVED: "default",
  EDITING_ASSIGNED: "outline",
  EDITING_IN_PROGRESS: "secondary",
  FINAL_REVIEW: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      editor: {
        select: { id: true, name: true, email: true },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Editors can only view their assigned projects
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && project.editorId !== session.user.id) {
    redirect("/dashboard");
  }

  // Get editors for assignment dropdown
  const editors = isAdmin
    ? await prisma.user.findMany({
        where: { role: "EDITOR", isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.videoIdea}</h1>
            <Badge variant={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Client: {project.client.name} | Deadline: {format(project.deadline, "PPP")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{project.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Content Niche</p>
                  <p className="font-medium">{project.client.contentNiche}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned Editor</p>
                  <p className="font-medium">
                    {project.editor?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(project.createdAt, "PPP")}</p>
                </div>
              </div>

              {project.client.brandGuidelinesUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">Brand Guidelines</p>
                  <a
                    href={project.client.brandGuidelinesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Guidelines
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Research Output */}
          {project.researchOutput && (
            <Card>
              <CardHeader>
                <CardTitle>Research Output</CardTitle>
                <CardDescription>Generated by the Research Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                    {project.researchOutput}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Script */}
          {project.script && (
            <Card>
              <CardHeader>
                <CardTitle>Script</CardTitle>
                <CardDescription>Generated by the Scripting Agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                    {project.script}
                  </pre>
                </div>
                {project.scriptFeedback && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Feedback:
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {project.scriptFeedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          {(project.rawVideoUrl || project.finalVideoUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Videos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.rawVideoUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Raw Video (HeyGen)</p>
                    <a
                      href={project.rawVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Raw Video
                    </a>
                  </div>
                )}
                {project.finalVideoUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Final Edited Video</p>
                    <a
                      href={project.finalVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View Final Video
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectActions
                project={{
                  id: project.id,
                  status: project.status,
                  editorId: project.editorId,
                  script: project.script,
                  rawVideoUrl: project.rawVideoUrl,
                  webhookStatus: project.webhookStatus,
                  webhookError: project.webhookError,
                  retryCount: project.retryCount,
                }}
                isAdmin={isAdmin}
                editors={editors}
                currentUserId={session.user.id}
              />
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTimeline activities={project.activityLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
