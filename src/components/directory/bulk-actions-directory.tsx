"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, Square, X, Users, Building2, Briefcase, 
  Mail, Loader2, AlertCircle, CheckCircle, MapPin, Scale
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  manager: { id: string; fullName: string; avatarUrl: string | null } | null;
}

interface Department {
  id: string;
  name: string;
}

interface LegalEntity {
  id: string;
  name: string;
  shortName: string | null;
}

interface BulkActionsDirectoryProps {
  employees: Employee[];
  departments: Department[];
  legalEntities: LegalEntity[];
  canBulkEdit: boolean;
}

const statusColors: Record<string, "success" | "warning" | "secondary" | "default"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  MATERNITY: "warning",
  PENDING: "secondary",
};

const statuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PENDING", label: "Pending" },
];

export function BulkActionsDirectory({ 
  employees, 
  departments, 
  legalEntities,
  canBulkEdit 
}: BulkActionsDirectoryProps) {
  const router = useRouter();
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkField, setBulkField] = useState<string>("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(employees.map(e => e.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
    setShowBulkModal(false);
    setResult(null);
  };

  const openBulkModal = (field: string) => {
    setBulkField(field);
    setBulkValue("");
    setShowBulkModal(true);
    setResult(null);
  };

  const performBulkUpdate = async () => {
    if (!bulkField || selectedIds.size === 0) return;

    setIsUpdating(true);
    setResult(null);

    try {
      const response = await fetch("/api/employees/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selectedIds),
          updates: { [bulkField]: bulkValue || null },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, count: data.updatedCount });
        setTimeout(() => {
          exitBulkMode();
          router.refresh();
        }, 1500);
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (error) {
      setResult({ success: false, error: "Network error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      departmentId: "Department",
      legalEntityId: "Legal Entity",
      status: "Status",
    };
    return labels[field] || field;
  };

  return (
    <div>
      {/* Bulk mode controls */}
      {canBulkEdit && (
        <div className="mb-4">
          {!bulkMode ? (
            <Button variant="outline" size="sm" onClick={() => setBulkMode(true)} className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Select Multiple
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <Users className="h-4 w-4" />
                {selectedIds.size} selected
              </div>
              
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={selectAll}>
                  Select All ({employees.length})
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>

              <div className="h-6 w-px bg-blue-200" />

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => openBulkModal("departmentId")}
                  disabled={selectedIds.size === 0}
                  className="gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  Set Department
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => openBulkModal("legalEntityId")}
                  disabled={selectedIds.size === 0}
                  className="gap-1"
                >
                  <Scale className="h-4 w-4" />
                  Set Legal Entity
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => openBulkModal("status")}
                  disabled={selectedIds.size === 0}
                  className="gap-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  Set Status
                </Button>
              </div>

              <div className="ml-auto">
                <Button size="sm" variant="ghost" onClick={exitBulkMode}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {employees.map((employee) => (
          <div key={employee.id} className="relative">
            {bulkMode && (
              <button
                onClick={() => toggleSelect(employee.id)}
                className={`absolute top-2 left-2 z-10 p-1 rounded-md transition-colors ${
                  selectedIds.has(employee.id)
                    ? "bg-blue-600 text-white"
                    : "bg-white/80 text-slate-400 hover:bg-slate-100"
                }`}
              >
                {selectedIds.has(employee.id) ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
            )}
            
            <Link href={bulkMode ? "#" : `/profile/${employee.id}`} onClick={bulkMode ? (e) => { e.preventDefault(); toggleSelect(employee.id); } : undefined}>
              <Card className={`group cursor-pointer transition-all duration-300 ${
                bulkMode && selectedIds.has(employee.id) 
                  ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20" 
                  : "hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <UserAvatar
                        name={employee.fullName}
                        imageUrl={employee.avatarUrl}
                        className="h-20 w-20 text-xl ring-4 ring-slate-100 group-hover:ring-blue-100 transition-all"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        <Badge variant={statusColors[employee.status] || "default"} className="text-xs px-2">
                          {employee.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {employee.fullName}
                    </h3>

                    {employee.position && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{employee.position.title}</span>
                      </div>
                    )}

                    {employee.department && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{employee.department.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">{employee.email}</span>
                    </div>

                    {employee.manager && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 w-full">
                        <UserAvatar
                          name={employee.manager.fullName}
                          imageUrl={employee.manager.avatarUrl}
                          className="h-6 w-6 text-xs"
                        />
                        <span className="text-xs text-slate-500">
                          Reports to {employee.manager.fullName}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Bulk update modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Update {getFieldLabel(bulkField)}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Applying to {selectedIds.size} selected employee{selectedIds.size !== 1 ? "s" : ""}
              </p>

              {bulkField === "departmentId" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Remove Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              )}

              {bulkField === "legalEntityId" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Remove Legal Entity --</option>
                  {legalEntities.map((le) => (
                    <option key={le.id} value={le.id}>{le.shortName || le.name}</option>
                  ))}
                </select>
              )}

              {bulkField === "status" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Status --</option>
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}

              {result && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {result.success ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Updated {result.count} employees
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      {result.error}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBulkModal(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={performBulkUpdate}
                  disabled={isUpdating || (bulkField === "status" && !bulkValue)}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Apply to All"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
