import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FieldVisibilityManager } from "@/components/admin/field-visibility-manager";

export default async function FieldVisibilityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.roles?.includes("ADMIN");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <FieldVisibilityManager />;
}
