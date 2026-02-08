import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

// Statuses that indicate active work
const ACTIVE_STATUSES: ProjectStatus[] = [
  "RESEARCH_IN_PROGRESS",
  "SCRIPT_IN_PROGRESS",
  "PRODUCTION_IN_PROGRESS",
  "EDITING_IN_PROGRESS",
];

// Statuses that require admin action
const ADMIN_PENDING_STATUSES: ProjectStatus[] = [
  "SCRIPT_PENDING_APPROVAL",
  "PRODUCTION_PENDING_APPROVAL",
  "FINAL_REVIEW",
];

// Statuses that require editor action
const EDITOR_PENDING_STATUSES: ProjectStatus[] = [
  "EDITING_ASSIGNED",
  "EDITING_IN_PROGRESS",
];

// Terminal statuses
const TERMINAL_STATUSES: ProjectStatus[] = ["COMPLETED", "CANCELLED"];

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  // Get metrics based on role
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Active projects (in progress, not completed/cancelled)
  const activeProjectsCount = await prisma.project.count({
    where: isAdmin
      ? { status: { in: ACTIVE_STATUSES } }
      : { editorId: userId, status: { in: ACTIVE_STATUSES } },
  });

  // Pending actions (awaiting approval/action)
  const pendingActionsCount = await prisma.project.count({
    where: isAdmin
      ? { status: { in: ADMIN_PENDING_STATUSES } }
      : { editorId: userId, status: { in: EDITOR_PENDING_STATUSES } },
  });

  // Completed this week
  const completedThisWeekCount = await prisma.project.count({
    where: {
      status: "COMPLETED",
      updatedAt: { gte: weekAgo },
      ...(isAdmin ? {} : { editorId: userId }),
    },
  });

  // Due soon (deadline within 3 days, not completed/cancelled)
  const dueSoonCount = await prisma.project.count({
    where: {
      deadline: { lte: threeDaysFromNow, gte: now },
      status: { notIn: TERMINAL_STATUSES },
      ...(isAdmin ? {} : { editorId: userId }),
    },
  });

  // Recent projects for the list
  const recentProjects = await prisma.project.findMany({
    where: isAdmin ? {} : { editorId: userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      videoIdea: true,
      status: true,
      deadline: true,
      updatedAt: true,
      client: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjectsCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertCircle className={`h-4 w-4 ${pendingActionsCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingActionsCount}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Awaiting your approval" : "Awaiting action"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisWeekCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className={`h-4 w-4 ${dueSoonCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonCount}</div>
            <p className="text-xs text-muted-foreground">
              Within next 3 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Projects */}
      <div className="grid gap-4 md:grid-cols-2">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Create your first project to get started.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className={isAdmin ? "" : "md:col-span-2"}>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No projects yet. {isAdmin ? "Create a project to get started." : "Waiting for project assignments."}
              </p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{project.videoIdea}</p>
                        <p className="text-sm text-muted-foreground">{project.client.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {project.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {format(project.updatedAt, "MMM d")} · Due {format(project.deadline, "MMM d")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
