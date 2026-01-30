"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createEditorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createEditor(formData: FormData): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = createEditorSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "Email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "EDITOR",
    },
  });

  revalidatePath("/dashboard/editors");
  redirect("/dashboard/editors");
}

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { name, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.id !== userId) {
    return { success: false, error: "Email already exists" };
  }

  const updateData: { name: string; email: string; password?: string } = {
    name,
    email,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath("/dashboard/editors");
  revalidatePath(`/dashboard/editors/${userId}`);

  return { success: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  // Prevent deleting yourself
  if (session.user.id === userId) {
    return { success: false, error: "Cannot delete your own account" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Check if user has assigned projects
  const assignedProjects = await prisma.project.count({
    where: { editorId: userId },
  });

  if (assignedProjects > 0) {
    return {
      success: false,
      error: `Cannot delete user with ${assignedProjects} assigned projects`
    };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/dashboard/editors");

  return { success: true };
}
