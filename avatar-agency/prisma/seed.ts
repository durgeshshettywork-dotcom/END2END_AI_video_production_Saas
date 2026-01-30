import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@avataragen.cy" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@avataragen.cy",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create editor user
  const editorPassword = await bcrypt.hash("editor123", 10);
  const editor = await prisma.user.upsert({
    where: { email: "editor@avataragen.cy" },
    update: {},
    create: {
      name: "Editor User",
      email: "editor@avataragen.cy",
      password: editorPassword,
      role: "EDITOR",
    },
  });
  console.log("Created editor user:", editor.email);

  // Create sample client
  const client = await prisma.client.upsert({
    where: { id: "sample-client-1" },
    update: {},
    create: {
      id: "sample-client-1",
      name: "Demo Client",
      contentNiche: "Technology",
      avatarId: "demo-avatar-123",
      voiceId: "demo-voice-456",
      brandGuidelinesUrl: "https://drive.google.com/demo-brand-guidelines",
      editingGuidelinesUrl: "https://drive.google.com/demo-editing-guidelines",
    },
  });
  console.log("Created sample client:", client.name);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
