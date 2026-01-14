"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, X, Save, Loader2 } from "lucide-react";

interface SelfEditFormProps {
  employee: {
    id: string;
    phone: string | null;
    timezone: string | null;
  };
}

export function ProfileSelfEdit({ employee }: SelfEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    phone: employee.phone || "",
    timezone: employee.timezone || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}/self-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const timezones = [
    { value: "", label: "Select timezone" },
    { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
    { value: "Europe/Kaliningrad", label: "Kaliningrad (UTC+2)" },
    { value: "Europe/Samara", label: "Samara (UTC+4)" },
    { value: "Asia/Yekaterinburg", label: "Yekaterinburg (UTC+5)" },
    { value: "Asia/Omsk", label: "Omsk (UTC+6)" },
    { value: "Asia/Krasnoyarsk", label: "Krasnoyarsk (UTC+7)" },
    { value: "Asia/Irkutsk", label: "Irkutsk (UTC+8)" },
    { value: "Asia/Yakutsk", label: "Yakutsk (UTC+9)" },
    { value: "Asia/Vladivostok", label: "Vladivostok (UTC+10)" },
    { value: "Asia/Magadan", label: "Magadan (UTC+11)" },
    { value: "Asia/Kamchatka", label: "Kamchatka (UTC+12)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "New York (UTC-5)" },
    { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
    { value: "Europe/London", label: "London (UTC+0)" },
    { value: "Europe/Paris", label: "Paris (UTC+1)" },
    { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  ];

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit Contact Info
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Edit Contact Info</h2>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
