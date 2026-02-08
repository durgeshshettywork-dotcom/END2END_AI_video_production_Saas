import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Prisma } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Video, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ProjectFilters } from "./project-filters";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; client?: string }>;
}

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

const statusLabels: Record<string, string> = {
  CREATED: "Created",
  RESEARCH_IN_PROGRESS: "Researching",
  RESEARCH_COMPLETE: "Research Done",
  SCRIPT_IN_PROGRESS: "Scripting",
  SCRIPT_PENDING_APPROVAL: "Script Review",
  SCRIPT_APPROVED: "Script OK",
  PRODUCTION_IN_PROGRESS: "Producing",
  PRODUCTION_PENDING_APPROVAL: "Video Review",
  PRODUCTION_APPROVED: "Video OK",
  EDITING_ASSIGNED: "Edit Assigned",
  EDITING_IN_PROGRESS: "Editing",
  FINAL_REVIEW: "Final Review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";
  const params = await searchParams;
  const { search, status, client: clientId } = params;

  // Build the where clause based on filters
  const where: Prisma.ProjectWhereInput = {
    ...(isAdmin ? {} : { editorId: session.user.id }),
    ...(search && {
      OR: [
        { videoIdea: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status: status as ProjectStatus }),
    ...(clientId && { clientId }),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        select: { id: true, name: true },
      },
      editor: {
        select: { name: true },
      },
    },
  });

  // Get all clients for filter dropdown
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const activeProjects = projects.filter(
    (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
  );
  const pendingReview = projects.filter(
    (p) =>
      p.status === "SCRIPT_PENDING_APPROVAL" ||
      p.status === "PRODUCTION_PENDING_APPROVAL" ||
      p.status === "FINAL_REVIEW"
  );
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? "All Projects" : "My Projects"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage all video projects"
              : "View and edit your assigned projects"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded" />}>
        <ProjectFilters
          clients={clients}
          statuses={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
        />
      </Suspense>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {isAdmin
              ? "All video projects across all clients"
              : "Projects assigned to you"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video Idea</TableHead>
                <TableHead>Client</TableHead>
                {isAdmin && <TableHead>Editor</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {search || status || clientId
                      ? "No projects match your filters"
                      : "No projects found"}
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.videoIdea}
                      </Link>
                    </TableCell>
                    <TableCell>{project.client.name}</TableCell>
                    {isAdmin && (
                      <TableCell>{project.editor?.name || "Unassigned"}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(project.deadline, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(project.createdAt, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
