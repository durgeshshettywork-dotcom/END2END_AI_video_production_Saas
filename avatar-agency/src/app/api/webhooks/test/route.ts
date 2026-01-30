import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, secret } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (secret) {
      headers["X-Webhook-Secret"] = secret;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "test",
        timestamp: new Date().toISOString(),
        message: "Test connection from Avatar Agency",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Webhook returned ${response.status}: ${errorText.substring(0, 200)}`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 200 }
    );
  }
}
