import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Building2, Users, GitBranch, CheckCircle } from "lucide-react";
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
  const activeDepartments = departments.filter(d => d.isActive);
  const totalEmployees = departments.reduce((acc, d) => acc + d._count.employees, 0);
  const totalPositions = departments.reduce((acc, d) => acc + d._count.positions, 0);

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl shadow-indigo-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Departments</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Manage organizational structure and department hierarchy
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">{departments.length}</span>
              <span className="text-white/80 text-sm">Total</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{activeDepartments.length}</span>
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{totalEmployees}</span>
              <span className="text-white/80 text-sm">Employees</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <GitBranch className="h-4 w-4" />
              <span className="font-semibold">{totalPositions}</span>
              <span className="text-white/80 text-sm">Positions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department List with CRUD */}
      <DepartmentList departments={departments} />
    </div>
  );
}
