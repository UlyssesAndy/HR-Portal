"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Save, Loader2, CheckCircle, AlertCircle, 
  Eye, EyeOff, Users, Shield
} from "lucide-react";

const ROLES = ["EMPLOYEE", "MANAGER", "HR", "PAYROLL_FINANCE", "ADMIN"];
const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HR: "HR",
  PAYROLL_FINANCE: "Finance",
  ADMIN: "Admin",
};

interface FieldConfig {
  context: string;
  fieldName: string;
  label: string;
}

const FIELDS: FieldConfig[] = [
  { context: "directory", fieldName: "email", label: "Email" },
  { context: "directory", fieldName: "phone", label: "Phone" },
  { context: "directory", fieldName: "department", label: "Department" },
  { context: "directory", fieldName: "position", label: "Position" },
  { context: "directory", fieldName: "manager", label: "Manager" },
  { context: "directory", fieldName: "location", label: "Location" },
  { context: "profile", fieldName: "email", label: "Email" },
  { context: "profile", fieldName: "phone", label: "Phone" },
  { context: "profile", fieldName: "birthDate", label: "Birth Date" },
  { context: "profile", fieldName: "startDate", label: "Start Date" },
  { context: "profile", fieldName: "legalEntity", label: "Legal Entity" },
  { context: "profile", fieldName: "employmentType", label: "Employment Type" },
  { context: "profile", fieldName: "timezone", label: "Timezone" },
  { context: "profile", fieldName: "messengerHandle", label: "Messenger Handle" },
];

type ConfigState = Record<string, Record<string, Record<string, boolean>>>;

export function FieldVisibilityManager() {
  const [config, setConfig] = useState<ConfigState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/admin/field-visibility");
      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = (context: string, field: string, role: string) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      if (!newConfig[context]) newConfig[context] = {};
      if (!newConfig[context][field]) newConfig[context][field] = {};
      newConfig[context][field][role] = !newConfig[context][field]?.[role];
      return newConfig;
    });
    setHasChanges(true);
    setResult(null);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/field-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setResult({ success: true, message: "Configuration saved successfully" });
        setHasChanges(false);
      } else {
        const data = await response.json();
        setResult({ success: false, message: data.error || "Failed to save" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error" });
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldsForContext = (context: string) => {
    return FIELDS.filter(f => f.context === context);
  };

  const isVisible = (context: string, field: string, role: string) => {
    return config[context]?.[field]?.[role] ?? true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-500" />
            Field Visibility Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Configure which fields are visible to each role
          </p>
        </div>
        <Button 
          onClick={saveConfig} 
          disabled={isSaving || !hasChanges}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {result.message}
        </div>
      )}

      {/* Directory Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Directory Page Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Field</th>
                  {ROLES.map(role => (
                    <th key={role} className="text-center py-3 px-2 font-medium text-slate-700">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFieldsForContext("directory").map((field) => (
                  <tr key={field.fieldName} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{field.label}</td>
                    {ROLES.map(role => (
                      <td key={role} className="text-center py-3 px-2">
                        <button
                          onClick={() => toggleVisibility("directory", field.fieldName, role)}
                          className={`p-2 rounded-lg transition-colors ${
                            isVisible("directory", field.fieldName, role)
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {isVisible("directory", field.fieldName, role) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Profile Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Profile Page Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Field</th>
                  {ROLES.map(role => (
                    <th key={role} className="text-center py-3 px-2 font-medium text-slate-700">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getFieldsForContext("profile").map((field) => (
                  <tr key={field.fieldName} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{field.label}</td>
                    {ROLES.map(role => (
                      <td key={role} className="text-center py-3 px-2">
                        <button
                          onClick={() => toggleVisibility("profile", field.fieldName, role)}
                          className={`p-2 rounded-lg transition-colors ${
                            isVisible("profile", field.fieldName, role)
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {isVisible("profile", field.fieldName, role) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-green-100">
            <Eye className="h-3.5 w-3.5 text-green-600" />
          </div>
          <span>Visible to role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-100">
            <EyeOff className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span>Hidden from role</span>
        </div>
      </div>
    </div>
  );
}
