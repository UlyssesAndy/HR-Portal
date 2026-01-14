import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";
import { DepartmentList } from "@/components/admin/department-list";

async function getDepartments() {
  return db.department.findMany({
    include: {
      _count: {
        select: { employees: true, positions: true, children: true },
      },
      parent: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function DepartmentsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const departments = await getDepartments();

  return (
    <div className="space-y-8">
      {/* Header - Premium style */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Departments
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage organizational structure
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Departments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {departments.filter(d => d.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {departments.reduce((acc, d) => acc + d._count.employees, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department List with CRUD */}
      <DepartmentList departments={departments} />
    </div>
  );
}
