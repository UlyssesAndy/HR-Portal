"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Edit2, Trash2, CheckCircle, XCircle, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalEntity {
  id: string;
  name: string;
  shortName: string | null;
  inn: string | null;
  isActive: boolean;
  _count: {
    employees: number;
  };
}

interface LegalEntityFormProps {
  entity?: LegalEntity;
  onClose: () => void;
  onSaved: () => void;
}

function LegalEntityForm({ entity, onClose, onSaved }: LegalEntityFormProps) {
  const [name, setName] = useState(entity?.name || "");
  const [shortName, setShortName] = useState(entity?.shortName || "");
  const [inn, setInn] = useState(entity?.inn || "");
  const [isActive, setIsActive] = useState(entity?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = entity
        ? `/api/legal-entities/${entity.id}`
        : "/api/legal-entities";

      const res = await fetch(url, {
        method: entity ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortName, inn, isActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {entity ? "Edit Legal Entity" : "Add Legal Entity"}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ООО «Рога и Копыта»"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Short Name
            </label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Рога"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              INN
            </label>
            <input
              type="text"
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1234567890"
              maxLength={12}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : entity ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LegalEntityList() {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntity, setEditEntity] = useState<LegalEntity | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchEntities = async () => {
    try {
      const res = await fetch(
        `/api/legal-entities?includeInactive=${showInactive}`
      );
      const data = await res.json();
      setEntities(data.data || []);
    } catch (error) {
      console.error("Error fetching legal entities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [showInactive]);

  const handleDelete = async (entity: LegalEntity) => {
    if (entity._count.employees > 0) {
      alert(
        `Cannot delete: ${entity._count.employees} employees are assigned to this legal entity`
      );
      return;
    }

    if (!confirm(`Delete "${entity.name}"?`)) return;

    try {
      const res = await fetch(`/api/legal-entities/${entity.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      fetchEntities();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditEntity(null);
    fetchEntities();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Show inactive
          </label>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Add Legal Entity
        </button>
      </div>

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className={cn(
              "rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
              !entity.isActive && "opacity-60 bg-slate-50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    entity.isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {entity.shortName || entity.name}
                  </h3>
                  {entity.shortName && (
                    <p className="text-xs text-slate-500 mt-0.5">{entity.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditEntity(entity)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(entity)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {entity.inn && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span>INN: {entity.inn}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {entity._count.employees} employees
                </span>
                {entity.isActive ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {entities.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No legal entities found. Add your first one!
          </div>
        )}
      </div>

      {/* Form Modal */}
      {(showForm || editEntity) && (
        <LegalEntityForm
          entity={editEntity || undefined}
          onClose={() => {
            setShowForm(false);
            setEditEntity(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
