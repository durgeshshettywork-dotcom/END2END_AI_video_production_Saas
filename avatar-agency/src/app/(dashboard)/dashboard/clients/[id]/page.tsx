import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditClientForm } from "./form";
import { format } from "date-fns";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Client</CardTitle>
              <CardDescription>
                Update client details and configurations
              </CardDescription>
            </div>
            <Badge variant="outline">{client.contentNiche}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{format(client.createdAt, "PPP")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Projects:</span>
                <p className="font-medium">{client._count.projects}</p>
              </div>
            </div>
          </div>

          <EditClientForm
            client={{
              id: client.id,
              name: client.name,
              contentNiche: client.contentNiche,
              avatarId: client.avatarId || "",
              voiceId: client.voiceId || "",
              brandGuidelinesUrl: client.brandGuidelinesUrl || "",
              editingGuidelinesUrl: client.editingGuidelinesUrl || "",
            }}
            hasProjects={client._count.projects > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
