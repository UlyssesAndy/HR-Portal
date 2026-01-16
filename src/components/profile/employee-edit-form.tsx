"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, X, Loader2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface LegalEntity {
  id: string;
  name: string;
  shortName: string | null;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  timezone: string | null;
  status: string;
  departmentId: string | null;
  positionId: string | null;
  managerId: string | null;
  startDate: string | null;
  birthDate: string | null;
  employmentType: string | null;
  legalEntityId: string | null;
  statusNote: string | null;
  statusStartDate: string | null;
  statusEndDate: string | null;
  // Messaging
  mattermostUsername: string | null;
  telegramHandle: string | null;
  messengerHandle: string | null;
  // Emergency contacts
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
}

interface EmployeeEditFormProps {
  employee: Employee;
  departments: Department[];
  positions: Position[];
  managers: { id: string; fullName: string }[];
  legalEntities: LegalEntity[];
  onCancel: () => void;
}

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PENDING", label: "Pending" },
  { value: "TERMINATED", label: "Terminated" },
];

const employmentTypes = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "INTERN", label: "Intern" },
];

export function EmployeeEditForm({ 
  employee, 
  departments, 
  positions, 
  managers,
  legalEntities,
  onCancel 
}: EmployeeEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone || "",
    location: employee.location || "",
    timezone: employee.timezone || "",
    status: employee.status,
    departmentId: employee.departmentId || "",
    positionId: employee.positionId || "",
    managerId: employee.managerId || "",
    startDate: employee.startDate?.split("T")[0] || "",
    birthDate: employee.birthDate?.split("T")[0] || "",
    employmentType: employee.employmentType || "",
    legalEntityId: employee.legalEntityId || "",
    statusNote: employee.statusNote || "",
    statusStartDate: employee.statusStartDate?.split("T")[0] || "",
    statusEndDate: employee.statusEndDate?.split("T")[0] || "",
    // Messaging
    mattermostUsername: employee.mattermostUsername || "",
    telegramHandle: employee.telegramHandle || "",
    messengerHandle: employee.messengerHandle || "",
    // Emergency contacts
    emergencyContactName: employee.emergencyContactName || "",
    emergencyContactPhone: employee.emergencyContactPhone || "",
    emergencyContactEmail: employee.emergencyContactEmail || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update employee");
      }

      router.refresh();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Employee</span>
            <Badge variant="secondary">HR Edit Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                placeholder="America/New_York"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Messaging */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mattermost Username
              </label>
              <input
                type="text"
                name="mattermostUsername"
                value={formData.mattermostUsername}
                onChange={handleChange}
                placeholder="username (without @)"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telegram Handle
              </label>
              <input
                type="text"
                name="telegramHandle"
                value={formData.telegramHandle}
                onChange={handleChange}
                placeholder="username (without @)"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Messenger Handle
              </label>
              <input
                type="text"
                name="messengerHandle"
                value={formData.messengerHandle}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-4">
            <h4 className="font-medium text-red-800">Emergency Contact</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="emergencyContactEmail"
                  value={formData.emergencyContactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all bg-white"
                />
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Position
              </label>
              <select
                name="positionId"
                value={formData.positionId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">Select position</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manager
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">No manager</option>
                {managers.filter(m => m.id !== employee.id).map(mgr => (
                  <option key={mgr.id} value={mgr.id}>{mgr.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">Select type</option>
                {employmentTypes.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Details (if on leave) */}
          {formData.status !== "ACTIVE" && formData.status !== "PENDING" && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-4">
              <h4 className="font-medium text-amber-800">Status Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="statusStartDate"
                    value={formData.statusStartDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="statusEndDate"
                    value={formData.statusEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-1">
                  Note
                </label>
                <textarea
                  name="statusNote"
                  value={formData.statusNote}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Legal Entity
              </label>
              <select
                name="legalEntityId"
                value={formData.legalEntityId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">Select legal entity</option>
                {legalEntities.map(le => (
                  <option key={le.id} value={le.id}>{le.shortName || le.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
