import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewEditorForm } from "./form";

export default async function NewEditorPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Editor</CardTitle>
          <CardDescription>
            Create a new editor account for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewEditorForm />
        </CardContent>
      </Card>
    </div>
  );
}
