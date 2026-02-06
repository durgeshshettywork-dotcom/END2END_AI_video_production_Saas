import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contentNiche: true,
        avatarId: true,
        voiceId: true,
        brandGuidelinesUrl: true,
        editingGuidelinesUrl: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error in GET /api/clients:", error);
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
    const { name, contentNiche, avatarId, voiceId, brandGuidelinesUrl, editingGuidelinesUrl } = body;

    if (!name || !contentNiche) {
      return NextResponse.json(
        { error: "Name and content niche are required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        contentNiche,
        avatarId: avatarId || null,
        voiceId: voiceId || null,
        brandGuidelinesUrl: brandGuidelinesUrl || null,
        editingGuidelinesUrl: editingGuidelinesUrl || null,
      },
      select: {
        id: true,
        name: true,
        contentNiche: true,
        avatarId: true,
        voiceId: true,
        brandGuidelinesUrl: true,
        editingGuidelinesUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
