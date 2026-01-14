"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  X, 
  User, 
  Users, 
  Crown, 
  Wallet, 
  UserCog,
  Loader2,
  Search,
  Trash2
} from "lucide-react";

const ROLES = {
  EMPLOYEE: { label: "Employee", icon: User, color: "bg-slate-500", description: "Basic access to directory and profile" },
  MANAGER: { label: "Manager", icon: Users, color: "bg-blue-500", description: "Can view direct reports and team info" },
  HR: { label: "HR", icon: UserCog, color: "bg-purple-500", description: "Full employee data access and editing" },
  PAYROLL_FINANCE: { label: "Payroll/Finance", icon: Wallet, color: "bg-green-500", description: "Access to financial employee data" },
  ADMIN: { label: "Admin", icon: Crown, color: "bg-amber-500", description: "Full system administration access" },
};

interface Employee {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status?: string;
}

interface Assignment {
  id: string;
  role: string;
  isManualOverride: boolean;
  googleGroupSource: string | null;
  grantedAt: string;
  expiresAt: string | null;
  employee: Employee;
  grantedBy: { id: string; fullName: string } | null;
}

interface GroupMapping {
  id: string;
  googleGroupEmail: string;
  role: string;
  isActive: boolean;
}

interface RoleManagementProps {
  roleGroups: Record<string, Assignment[]>;
  employees: Employee[];
  groupMappings: GroupMapping[];
  currentUserId: string;
}

export function RoleManagement({ roleGroups, employees, groupMappings, currentUserId }: RoleManagementProps) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter employees who don't have the selected role
  const availableEmployees = employees.filter(emp => {
    const hasRole = roleGroups[selectedRole || ""]?.some(a => a.employee.id === emp.id);
    const matchesSearch = emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    return !hasRole && matchesSearch;
  });

  async function assignRole(employeeId: string) {
    if (!selectedRole) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, role: selectedRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign role");
      }

      router.refresh();
      setShowAddModal(false);
      setSelectedRole(null);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function revokeRole(assignmentId: string, employeeName: string, role: string) {
    if (!confirm(`Remove ${role} role from ${employeeName}?`)) return;

    try {
      const res = await fetch(`/api/roles/${assignmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke role");
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  }

  const totalAssignments = Object.values(roleGroups).flat().length;

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Assignments</p>
                <p className="text-2xl font-bold text-slate-900">{totalAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <p className="text-2xl font-bold text-slate-900">
                  {roleGroups["ADMIN"]?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <UserCog className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">HR Users</p>
                <p className="text-2xl font-bold text-slate-900">
                  {roleGroups["HR"]?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(ROLES).map(([roleKey, roleInfo]) => {
          const Icon = roleInfo.icon;
          const assignments = roleGroups[roleKey] || [];

          return (
            <Card key={roleKey}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${roleInfo.color} flex items-center justify-center text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span>{roleInfo.label}</span>
                      <p className="text-sm font-normal text-slate-500 mt-0.5">
                        {roleInfo.description}
                      </p>
                    </div>
                  </CardTitle>
                  <button
                    onClick={() => {
                      setSelectedRole(roleKey);
                      setShowAddModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                    title={`Add ${roleInfo.label}`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {assignments.length > 0 ? (
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                            {assignment.employee.avatarUrl ? (
                              <img
                                src={assignment.employee.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              assignment.employee.fullName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {assignment.employee.fullName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {assignment.employee.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.googleGroupSource && (
                            <Badge variant="secondary" className="text-xs">
                              Google
                            </Badge>
                          )}
                          {assignment.isManualOverride && (
                            <Badge variant="default" className="text-xs">
                              Manual
                            </Badge>
                          )}
                          {assignment.employee.id !== currentUserId || roleKey !== "ADMIN" ? (
                            <button
                              onClick={() => revokeRole(
                                assignment.id,
                                assignment.employee.fullName,
                                roleKey
                              )}
                              className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">(you)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No users with this role
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Google Group Mappings */}
      {groupMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Google Group Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{mapping.googleGroupEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mapping.isActive ? "success" : "secondary"}>
                      {mapping.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge>{mapping.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Role Modal */}
      {showAddModal && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAddModal(false);
            setSelectedRole(null);
            setSearchQuery("");
            setError("");
          }} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Add {ROLES[selectedRole as keyof typeof ROLES]?.label}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedRole(null);
                  setSearchQuery("");
                  setError("");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Employee list */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {availableEmployees.length > 0 ? (
                  availableEmployees.slice(0, 20).map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => assignRole(emp.id)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden flex-shrink-0">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          emp.fullName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{emp.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                      </div>
                      {loading && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 ml-auto" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    {searchQuery ? "No matching employees" : "All employees have this role"}
                  </p>
                )}
                {availableEmployees.length > 20 && (
                  <p className="text-center text-sm text-slate-500 pt-2">
                    +{availableEmployees.length - 20} more. Refine your search.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
