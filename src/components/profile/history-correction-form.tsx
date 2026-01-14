"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, History, Plus } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Manager {
  id: string;
  fullName: string;
}

interface HistoryCorrectionFormProps {
  employeeId: string;
  employeeName: string;
  departments?: Department[];
  positions?: Position[];
  managers?: Manager[];
  onClose: () => void;
}

const FIELD_OPTIONS = [
  { value: "departmentId", label: "Department", type: "select" },
  { value: "positionId", label: "Position", type: "select" },
  { value: "managerId", label: "Manager", type: "select" },
  { value: "status", label: "Status", type: "select" },
  { value: "location", label: "Location", type: "text" },
  { value: "startDate", label: "Start Date", type: "date" },
  { value: "phone", label: "Phone", type: "text" },
  { value: "other", label: "Other (custom)", type: "text" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "PENDING", label: "Pending" },
];

export function HistoryCorrectionForm({
  employeeId,
  employeeName,
  departments = [],
  positions = [],
  managers = [],
  onClose,
}: HistoryCorrectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fieldName, setFieldName] = useState("");
  const [customFieldName, setCustomFieldName] = useState("");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const selectedField = FIELD_OPTIONS.find((f) => f.value === fieldName);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const actualFieldName = fieldName === "other" ? customFieldName : fieldName;

    if (!actualFieldName) {
      setError("Please select or enter a field name");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/employees/${employeeId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldName: actualFieldName,
          oldValue: oldValue || null,
          newValue: newValue || null,
          changeNote,
          effectiveDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add correction");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function renderValueInput(isNew: boolean) {
    const value = isNew ? newValue : oldValue;
    const setValue = isNew ? setNewValue : setOldValue;
    const label = isNew ? "New Value" : "Old Value";

    if (!fieldName || fieldName === "other") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    if (fieldName === "departmentId") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldName === "positionId") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select position</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldName === "managerId") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldName === "status") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (selectedField?.type === "date") {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter value"
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add History Correction</h2>
              <p className="text-sm text-slate-500">{employeeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Field <span className="text-red-500">*</span>
            </label>
            <select
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                setOldValue("");
                setNewValue("");
              }}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select field to correct</option>
              {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom field name */}
          {fieldName === "other" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Custom Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
                placeholder="e.g., salary_grade"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Old Value */}
          {renderValueInput(false)}

          {/* New Value */}
          {renderValueInput(true)}

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correction Note
            </label>
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Reason for this correction..."
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Correction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
