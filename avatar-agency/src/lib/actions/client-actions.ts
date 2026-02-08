"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contentNiche: z.string().min(2, "Content niche is required"),
  avatarId: z.string().optional(),
  voiceId: z.string().optional(),
  brandGuidelinesUrl: z.string().url().optional().or(z.literal("")),
  editingGuidelinesUrl: z.string().url().optional().or(z.literal("")),
});

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createClient(formData: FormData): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = clientSchema.safeParse({
    name: formData.get("name"),
    contentNiche: formData.get("contentNiche"),
    avatarId: formData.get("avatarId") || undefined,
    voiceId: formData.get("voiceId") || undefined,
    brandGuidelinesUrl: formData.get("brandGuidelinesUrl") || undefined,
    editingGuidelinesUrl: formData.get("editingGuidelinesUrl") || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { name, contentNiche, avatarId, voiceId, brandGuidelinesUrl, editingGuidelinesUrl } = validatedFields.data;

  await prisma.client.create({
    data: {
      name,
      contentNiche,
      avatarId: avatarId || "",
      voiceId: voiceId || "",
      brandGuidelinesUrl: brandGuidelinesUrl || null,
      editingGuidelinesUrl: editingGuidelinesUrl || null,
    },
  });

  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function updateClient(
  clientId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validatedFields = clientSchema.safeParse({
    name: formData.get("name"),
    contentNiche: formData.get("contentNiche"),
    avatarId: formData.get("avatarId") || undefined,
    voiceId: formData.get("voiceId") || undefined,
    brandGuidelinesUrl: formData.get("brandGuidelinesUrl") || undefined,
    editingGuidelinesUrl: formData.get("editingGuidelinesUrl") || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues[0].message
    };
  }

  const { name, contentNiche, avatarId, voiceId, brandGuidelinesUrl, editingGuidelinesUrl } = validatedFields.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      contentNiche,
      avatarId: avatarId || "",
      voiceId: voiceId || "",
      brandGuidelinesUrl: brandGuidelinesUrl || null,
      editingGuidelinesUrl: editingGuidelinesUrl || null,
    },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);

  return { success: true };
}

export async function deleteClient(clientId: string): Promise<ActionResult> {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!client) {
    return { success: false, error: "Client not found" };
  }

  if (client._count.projects > 0) {
    return {
      success: false,
      error: `Cannot delete client with ${client._count.projects} projects`
    };
  }

  await prisma.client.delete({
    where: { id: clientId },
  });

  revalidatePath("/dashboard/clients");

  return { success: true };
}
