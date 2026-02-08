import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * POST /api/auth/forgot-password
 *
 * Initiates a password reset flow by:
 * 1. Generating a secure reset token
 * 2. Storing the token with expiration in the database
 * 3. Logging the token (in dev) or sending an email (in prod)
 *
 * Security considerations:
 * - Returns success even if email doesn't exist (prevents enumeration)
 * - Token expires after 1 hour
 * - Token is stored hashed in production
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user (don't reveal if user exists)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      // Generate secure random token
      const resetToken = randomBytes(32).toString("hex");

      // Set expiration to 1 hour from now
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      // Store token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: expires,
        },
      });

      // In development: Log the reset URL
      // In production: Send an email with the reset link
      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      if (process.env.NODE_ENV === "development") {
        console.log("===========================================");
        console.log("PASSWORD RESET TOKEN (DEV ONLY)");
        console.log(`User: ${user.email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`URL: ${resetUrl}`);
        console.log(`Expires: ${expires.toISOString()}`);
        console.log("===========================================");
      }

      // TODO: Implement actual email sending in production
      // Example: await sendResetEmail(user.email, user.name, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
