import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isHR, isAdmin, type CurrentUser } from "@/types";
import { LegalEntityList } from "@/components/admin/legal-entity-list";
import { db } from "@/lib/db";
import { Building2, Scale, CheckCircle, Users } from "lucide-react";

async function getLegalEntityStats() {
  const [entities, employeeCounts] = await Promise.all([
    db.legalEntity.findMany({
      select: { id: true, isActive: true },
    }),
    db.employee.groupBy({
      by: ["legalEntityId"],
      _count: { id: true },
      where: { legalEntityId: { not: null } },
    }),
  ]);
  
  const totalEmployees = employeeCounts.reduce((acc, e) => acc + e._count.id, 0);
  
  return {
    total: entities.length,
    active: entities.filter(e => e.isActive).length,
    employees: totalEmployees,
  };
}

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

  const stats = await getLegalEntityStats();

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Legal Entities</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Manage company legal entities and organizational structure
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">{stats.total}</span>
              <span className="text-white/80 text-sm">Total</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{stats.active}</span>
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{stats.employees}</span>
              <span className="text-white/80 text-sm">Employees</span>
            </div>
          </div>
        </div>
      </div>

      {/* List Component */}
      <LegalEntityList />
    </div>
  );
}
