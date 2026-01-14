"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  UserCog,
  Building2,
  Users,
  Briefcase,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle,
  Scale,
} from "lucide-react";

interface QuickActionsProps {
  employeeId: string;
  employeeName: string;
  currentStatus: string;
  canEdit: boolean;
  departments: { id: string; name: string }[];
  legalEntities: { id: string; name: string; shortName: string | null }[];
  managers: { id: string; fullName: string }[];
}

const statusOptions = [
  { value: "ACTIVE", label: "Active", color: "text-green-600" },
  { value: "ON_LEAVE", label: "On Leave", color: "text-yellow-600" },
  { value: "MATERNITY", label: "Maternity", color: "text-purple-600" },
  { value: "PENDING", label: "Pending", color: "text-slate-600" },
  { value: "TERMINATED", label: "Terminated", color: "text-red-600" },
];

export function QuickActions({
  employeeId,
  employeeName,
  currentStatus,
  canEdit,
  departments,
  legalEntities,
  managers,
}: QuickActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!canEdit) return null;

  const handleQuickUpdate = async (field: string, value: string) => {
    setIsUpdating(true);
    setResult(null);

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value || null }),
      });

      if (response.ok) {
        setResult({ success: true, message: "Updated successfully" });
        setTimeout(() => {
          setShowModal(null);
          setResult(null);
          router.refresh();
        }, 1000);
      } else {
        const data = await response.json();
        setResult({ success: false, message: data.error || "Update failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (type: string, currentValue?: string) => {
    setShowModal(type);
    setSelectedValue(currentValue || "");
    setResult(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MoreHorizontal className="h-4 w-4" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => openModal("status", currentStatus)}>
            <AlertCircle className="h-4 w-4 mr-2" />
            Change Status
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal("department")}>
            <Building2 className="h-4 w-4 mr-2" />
            Change Department
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal("legalEntity")}>
            <Scale className="h-4 w-4 mr-2" />
            Change Legal Entity
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openModal("manager")}>
            <Users className="h-4 w-4 mr-2" />
            Reassign Manager
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Action Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                {showModal === "status" && "Change Status"}
                {showModal === "department" && "Change Department"}
                {showModal === "legalEntity" && "Change Legal Entity"}
                {showModal === "manager" && "Reassign Manager"}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                For {employeeName}
              </p>

              {showModal === "status" && (
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setSelectedValue(status.value)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        selectedValue === status.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={status.color}>{status.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {showModal === "department" && (
                <select
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}

              {showModal === "legalEntity" && (
                <select
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No Legal Entity --</option>
                  {legalEntities.map((le) => (
                    <option key={le.id} value={le.id}>
                      {le.shortName || le.name}
                    </option>
                  ))}
                </select>
              )}

              {showModal === "manager" && (
                <select
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No Manager --</option>
                  {managers.filter((m) => m.id !== employeeId).map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.fullName}
                    </option>
                  ))}
                </select>
              )}

              {result && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  {result.message}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const fieldMap: Record<string, string> = {
                      status: "status",
                      department: "departmentId",
                      legalEntity: "legalEntityId",
                      manager: "managerId",
                    };
                    handleQuickUpdate(fieldMap[showModal], selectedValue);
                  }}
                  disabled={isUpdating || (showModal === "status" && !selectedValue)}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
