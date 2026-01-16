import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrgChartPro } from "@/components/org-chart/org-chart-pro";
import { Network, Users, GitBranch, Layers, Crown, Building2 } from "lucide-react";

interface EmployeeNode {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  position: { title: string } | null;
  department: { name: string } | null;
  location: string | null;
  managerId: string | null;
}

// Build tree recursively
function buildTree(
  employees: EmployeeNode[], 
  parentId: string | null = null,
  depth: number = 0,
  maxDepth: number = 10
): any[] {
  if (depth > maxDepth) return [];
  
  return employees
    .filter(emp => emp.managerId === parentId)
    .map(emp => ({
      ...emp,
      directReports: buildTree(employees, emp.id, depth + 1, maxDepth),
    }));
}

async function getOrgData() {
  const employees = await db.employee.findMany({
    where: { status: { not: "TERMINATED" } },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      managerId: true,
      location: true,
      position: { select: { title: true } },
      department: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  // Build the tree starting from employees without managers (top-level)
  const tree = buildTree(employees, null);
  
  // Count stats
  const totalWithManager = employees.filter(e => e.managerId).length;
  const uniqueManagers = new Set(employees.filter(e => e.managerId).map(e => e.managerId)).size;
  const maxDepth = calculateMaxDepth(tree);
  
  // Flatten all employees with directReports added
  const addDirectReports = (emps: EmployeeNode[]): any[] => {
    return emps.map(emp => ({
      ...emp,
      directReports: employees.filter(e => e.managerId === emp.id).map(e => ({
        ...e,
        directReports: [],
      })),
    }));
  };
  
  return { 
    tree, 
    allEmployees: addDirectReports(employees),
    stats: {
      total: employees.length,
      topLevel: tree.length,
      withManager: totalWithManager,
      managers: uniqueManagers,
      maxDepth,
    }
  };
}

function calculateMaxDepth(nodes: any[], current: number = 1): number {
  if (nodes.length === 0) return current - 1;
  return Math.max(...nodes.map(n => calculateMaxDepth(n.directReports, current + 1)));
}

export default async function OrgChartPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const canEdit = session.user.roles?.includes("HR") || session.user.roles?.includes("ADMIN");
  const { tree, allEmployees, stats } = await getOrgData();

  return (
    <div className="space-y-4">
      {/* Premium gradient header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Organization Chart</h1>
              <p className="text-white/70 mt-0.5">Interactive team structure visualization</p>
            </div>
          </div>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/10 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-300" />
              <span className="font-bold">{stats.total}</span>
              <span className="text-xs text-white/60">people</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/10 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-300" />
              <span className="font-bold">{stats.managers}</span>
              <span className="text-xs text-white/60">managers</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/10 flex items-center gap-2">
              <Layers className="h-4 w-4 text-pink-300" />
              <span className="font-bold">{stats.maxDepth}</span>
              <span className="text-xs text-white/60">levels</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/10 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-300" />
              <span className="font-bold">{stats.topLevel}</span>
              <span className="text-xs text-white/60">top-level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Org Chart */}
      <OrgChartPro 
        rootEmployees={tree} 
        allEmployees={allEmployees}
        canEdit={canEdit}
      />
    </div>
  );
}
