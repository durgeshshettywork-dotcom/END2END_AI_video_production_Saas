import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        take: 20,
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Editors can only view their assigned projects
  if (session.user.role !== "ADMIN" && project.editorId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Editors can only update their assigned projects
  if (session.user.role !== "ADMIN" && project.editorId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { videoIdea, deadline, editorId, status, scriptFeedback, finalVideoUrl } = body;

  const updateData: {
    videoIdea?: string;
    deadline?: Date;
    editorId?: string | null;
    status?: ProjectStatus;
    scriptFeedback?: string | null;
    finalVideoUrl?: string | null;
  } = {};

  // Only admins can update certain fields
  if (session.user.role === "ADMIN") {
    if (videoIdea !== undefined) updateData.videoIdea = videoIdea;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (editorId !== undefined) updateData.editorId = editorId || null;
    if (status !== undefined) updateData.status = status;
    if (scriptFeedback !== undefined) updateData.scriptFeedback = scriptFeedback || null;
  }

  // Both admins and editors can update final video URL
  if (finalVideoUrl !== undefined) updateData.finalVideoUrl = finalVideoUrl;

  const updatedProject = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: { id: true, name: true },
      },
      editor: {
        select: { id: true, name: true },
      },
    },
  });

  // Log status change
  if (status && status !== project.status) {
    await prisma.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        projectId: id,
        userId: session.user.id,
        details: { from: project.status, to: status },
      },
    });
  }

  return NextResponse.json(updatedProject);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Delete associated activity logs first (cascade should handle this)
  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
