import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ProjectStatus, Prisma } from "@prisma/client";
import { onProjectCreated } from "@/lib/services/webhook-orchestrator";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const where: Prisma.ProjectWhereInput = {};

    // Editors can only see their assigned projects
    if (session.user.role !== "ADMIN") {
      where.editorId = session.user.id;
    }

    if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      where.status = status as ProjectStatus;
    }
    if (clientId) where.clientId = clientId;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { id: true, name: true },
        },
        editor: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoIdea, deadline, clientId, editorId } = body;

    if (!videoIdea || !deadline || !clientId) {
      return NextResponse.json(
        { error: "Video idea, deadline, and client are required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const project = await prisma.project.create({
      data: {
        videoIdea,
        deadline: new Date(deadline),
        clientId,
        editorId: editorId || null,
        status: "CREATED",
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        editor: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "PROJECT_CREATED",
        projectId: project.id,
        userId: session.user.id,
        details: JSON.stringify({ videoIdea }),
      },
    });

    // Trigger research webhook (starts the automated pipeline)
    // This runs async - we don't wait for it to complete
    onProjectCreated(project.id).catch((error) => {
      console.error("Failed to trigger research webhook:", error);
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
