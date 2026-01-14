import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RoleManagement } from "@/components/admin/role-management";

async function getRoleData() {
  const [assignments, employees, groupMappings] = await Promise.all([
    db.roleAssignment.findMany({
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
        grantedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ role: "asc" }, { employee: { fullName: "asc" } }],
    }),
    db.employee.findMany({
      where: { status: { not: "TERMINATED" } },
      select: { id: true, fullName: true, email: true, avatarUrl: true },
      orderBy: { fullName: "asc" },
    }),
    db.googleGroupRoleMapping.findMany({
      orderBy: { googleGroupEmail: "asc" },
    }),
  ]);

  return { assignments, employees, groupMappings };
}

export default async function RolesAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { assignments, employees, groupMappings } = await getRoleData();

  // Group assignments by role and convert dates to strings
  const roleGroups = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.role]) acc[assignment.role] = [];
    acc[assignment.role].push({
      ...assignment,
      grantedAt: assignment.grantedAt.toISOString(),
      expiresAt: assignment.expiresAt?.toISOString() ?? null,
    });
    return acc;
  }, {} as Record<string, Array<Omit<typeof assignments[0], 'grantedAt' | 'expiresAt'> & { grantedAt: string; expiresAt: string | null }>>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Role Management
        </h1>
        <p className="text-slate-500 mt-1">
          Manage user roles and permissions
        </p>
      </div>

      <RoleManagement
        roleGroups={roleGroups}
        employees={employees}
        groupMappings={groupMappings}
        currentUserId={session.user.id}
      />
    </div>
  );
}
