import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isHR, isAdmin, type CurrentUser } from "@/types";
import { LegalEntityList } from "@/components/admin/legal-entity-list";
import { Building2 } from "lucide-react";

export default async function LegalEntitiesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const currentUser: CurrentUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || "",
    image: session.user.image || undefined,
    roles: session.user.roles || ["EMPLOYEE"],
  };

  if (!isHR(currentUser) && !isAdmin(currentUser)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Legal Entities</h1>
          <p className="text-slate-500">Manage company legal entities</p>
        </div>
      </div>

      {/* List Component */}
      <LegalEntityList />
    </div>
  );
}
