import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditUserForm } from "./form";
import { format } from "date-fns";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assignedProjects: true },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isCurrentUser = session.user.id === user.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>
                Update user details and permissions
              </CardDescription>
            </div>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Joined:</span>
                <p className="font-medium">{format(user.createdAt, "PPP")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Assigned Projects:</span>
                <p className="font-medium">{user._count.assignedProjects}</p>
              </div>
            </div>
          </div>

          <EditUserForm
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }}
            isCurrentUser={isCurrentUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}
