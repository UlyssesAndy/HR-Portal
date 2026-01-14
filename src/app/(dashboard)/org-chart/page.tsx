import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrgChartPro } from "@/components/org-chart/org-chart-pro";
import { Network, Users, GitBranch, Layers } from "lucide-react";

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
      {/* Premium header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">Organization</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Team structure</p>
          </div>
        </div>

        {/* Compact stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{stats.total}</span>
            <span>people</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <GitBranch className="h-4 w-4 text-purple-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{stats.managers}</span>
            <span>managers</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Layers className="h-4 w-4 text-pink-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{stats.maxDepth}</span>
            <span>levels</span>
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
