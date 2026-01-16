import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PositionList } from "@/components/admin/position-list";
import { Briefcase, Users, Building2, CheckCircle } from "lucide-react";

async function getPositions() {
  return db.position.findMany({
    include: {
      department: { select: { id: true, name: true } },
      _count: { select: { employees: true } },
    },
    orderBy: [{ department: { name: "asc" } }, { title: "asc" }],
  });
}

async function getDepartments() {
  return db.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function PositionsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const [positions, departments] = await Promise.all([
    getPositions(),
    getDepartments(),
  ]);

  const activePositions = positions.filter(p => p.isActive);
  const totalEmployees = positions.reduce((acc, p) => acc + p._count.employees, 0);
  const uniqueDepartments = new Set(positions.map(p => p.departmentId).filter(Boolean));

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl shadow-emerald-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Positions</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Manage job titles and positions across your organization
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Briefcase className="h-4 w-4" />
              <span className="font-semibold">{positions.length}</span>
              <span className="text-white/80 text-sm">Total</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{activePositions.length}</span>
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{totalEmployees}</span>
              <span className="text-white/80 text-sm">Employees</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">{uniqueDepartments.size}</span>
              <span className="text-white/80 text-sm">Departments</span>
            </div>
          </div>
        </div>
      </div>

      <PositionList positions={positions} departments={departments} />
    </div>
  );
}
