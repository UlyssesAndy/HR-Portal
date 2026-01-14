import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PositionList } from "@/components/admin/position-list";

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Positions
        </h1>
        <p className="text-slate-500 mt-1">
          Manage job titles and positions
        </p>
      </div>

      <PositionList positions={positions} departments={departments} />
    </div>
  );
}
