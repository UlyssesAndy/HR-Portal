import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RoleManagement } from "@/components/admin/role-management";
import { Shield, Users, Key, Crown } from "lucide-react";

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

  const totalAssignments = assignments.length;
  const uniqueRoles = Object.keys(roleGroups).length;
  const adminCount = roleGroups['ADMIN']?.length || 0;

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-xl shadow-amber-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Role Management</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Manage user roles and permissions across your organization
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Key className="h-4 w-4" />
              <span className="font-semibold">{totalAssignments}</span>
              <span className="text-white/80 text-sm">Assignments</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Shield className="h-4 w-4" />
              <span className="font-semibold">{uniqueRoles}</span>
              <span className="text-white/80 text-sm">Roles</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Crown className="h-4 w-4" />
              <span className="font-semibold">{adminCount}</span>
              <span className="text-white/80 text-sm">Admins</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold">{employees.length}</span>
              <span className="text-white/80 text-sm">Employees</span>
            </div>
          </div>
        </div>
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
