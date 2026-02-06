import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await prisma.webhookConfig.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error in GET /api/webhooks/config:", error);
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
    const { name, url, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const validNames = ["research", "scripting", "optimizer", "production", "notification"];
    if (!validNames.includes(name)) {
      return NextResponse.json({ error: "Invalid webhook name" }, { status: 400 });
    }

    // Note: Secrets are no longer stored in database - use WEBHOOK_SECRET env var
    const config = await prisma.webhookConfig.upsert({
      where: { name },
      update: {
        url: url || "",
        isActive: isActive ?? true,
      },
      create: {
        name,
        url: url || "",
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error in POST /api/webhooks/config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
