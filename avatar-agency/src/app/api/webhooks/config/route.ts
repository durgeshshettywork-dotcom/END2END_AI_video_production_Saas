import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await prisma.webhookConfig.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, url, secret, isActive } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const validNames = ["research", "scripting", "optimizer", "production", "notification"];
  if (!validNames.includes(name)) {
    return NextResponse.json({ error: "Invalid webhook name" }, { status: 400 });
  }

  const config = await prisma.webhookConfig.upsert({
    where: { name },
    update: {
      url: url || "",
      secret: secret || null,
      isActive: isActive ?? true,
    },
    create: {
      name,
      url: url || "",
      secret: secret || null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(config);
}
