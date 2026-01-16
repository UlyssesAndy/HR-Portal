"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  MessageSquare,
  Mail,
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Key,
  Server,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle2,
  Plug,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  customerId?: string;
  serviceAccountEmail?: string;
  serviceAccountKey?: string | null;
  adminEmail?: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  allowedDomains: string[];
  autoProvision: boolean;
  defaultLegalEntityId?: string;
  isActive: boolean;
  defaultLegalEntity?: { id: string; name: string };
  _count?: { employees: number; syncRuns: number };
}

interface Setting {
  id: string;
  category: string;
  key: string;
  value?: string;
  isSecret: boolean;
  description?: string;
}



const tabs = [
  { id: "google", name: "Google Workspace", icon: Globe },
  { id: "mattermost", name: "Mattermost", icon: MessageSquare },
  { id: "smtp", name: "Email (SMTP)", icon: Mail },
  { id: "jira", name: "Jira", icon: Ticket },
];

// Default settings structure for each integration
const defaultSettings: Record<string, Array<{ key: string; label: string; isSecret: boolean; description: string; placeholder?: string }>> = {
  mattermost: [
    { key: "url", label: "Mattermost URL", isSecret: false, description: "Base URL of your Mattermost server", placeholder: "https://mattermost.company.com" },
    { key: "api_token", label: "API Token", isSecret: true, description: "Bot token or Personal Access Token for API access" },
    { key: "team_id", label: "Default Team ID", isSecret: false, description: "Default team for new users" },
    { key: "enabled", label: "Integration Enabled", isSecret: false, description: "Enable or disable Mattermost integration" },
  ],
  smtp: [
    { key: "host", label: "SMTP Host", isSecret: false, description: "SMTP server hostname", placeholder: "smtp.gmail.com" },
    { key: "port", label: "SMTP Port", isSecret: false, description: "SMTP server port", placeholder: "587" },
    { key: "user", label: "SMTP Username", isSecret: false, description: "Username for authentication" },
    { key: "password", label: "SMTP Password", isSecret: true, description: "Password for authentication" },
    { key: "from_email", label: "From Email", isSecret: false, description: "Sender email address", placeholder: "noreply@company.com" },
    { key: "from_name", label: "From Name", isSecret: false, description: "Sender display name", placeholder: "HR Portal" },
    { key: "secure", label: "Use TLS", isSecret: false, description: "Enable TLS encryption (true/false)" },
  ],
  jira: [
    { key: "url", label: "Jira URL", isSecret: false, description: "Base URL of your Jira instance", placeholder: "https://company.atlassian.net" },
    { key: "api_email", label: "API Email", isSecret: false, description: "Email for Jira API authentication" },
    { key: "api_token", label: "API Token", isSecret: true, description: "Jira API token" },
    { key: "project_key", label: "HR Project Key", isSecret: false, description: "Jira project key for HR requests", placeholder: "HR" },
    { key: "webhook_secret", label: "Webhook Secret", isSecret: true, description: "Secret for validating webhooks" },
    { key: "enabled", label: "Integration Enabled", isSecret: false, description: "Enable or disable Jira integration" },
  ],
};

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("google");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Tenant form state
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    domain: "",
    customerId: "",
    serviceAccountEmail: "",
    serviceAccountKey: "",
    adminEmail: "",
    syncEnabled: true,
    syncInterval: 1440,
    allowedDomains: "",
    autoProvision: true,
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tenantsRes, settingsRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch("/api/settings"),
      ]);

      if (tenantsRes.ok) {
        setTenants(await tenantsRes.json());
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        // Build form state from settings
        const form: Record<string, string> = {};
        settingsData.forEach((s: Setting) => {
          form[`${s.category}.${s.key}`] = s.value || "";
        });
        setSettingsForm(form);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load integration settings");
    } finally {
      setLoading(false);
    }
  }

  // Tenant CRUD
  async function saveTenant() {
    setSaving(true);
    try {
      const method = editingTenant ? "PUT" : "POST";
      const body = {
        ...tenantForm,
        id: editingTenant?.id,
        allowedDomains: tenantForm.allowedDomains.split(",").map(d => d.trim()).filter(Boolean),
        syncInterval: parseInt(String(tenantForm.syncInterval)) || 1440,

      };

      const res = await fetch("/api/tenants", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save tenant");
      }

      toast.success(editingTenant ? "Tenant updated" : "Tenant created");
      setShowTenantForm(false);
      setEditingTenant(null);
      resetTenantForm();
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tenant");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTenant(tenant: Tenant) {
    if (!confirm(`Delete tenant "${tenant.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/tenants?id=${tenant.id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete tenant");
      }
      toast.success("Tenant deleted");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete tenant");
    }
  }

  async function triggerSync(tenantId: string) {
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!res.ok) throw new Error("Sync failed");
      toast.success("Sync started");
      loadData();
    } catch {
      toast.error("Failed to start sync");
    }
  }

  function resetTenantForm() {
    setTenantForm({
      name: "",
      domain: "",
      customerId: "",
      serviceAccountEmail: "",
      serviceAccountKey: "",
      adminEmail: "",
      syncEnabled: true,
      syncInterval: 1440,
      allowedDomains: "",
      autoProvision: true,
    });
  }

  function editTenant(tenant: Tenant) {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.name,
      domain: tenant.domain,
      customerId: tenant.customerId || "",
      serviceAccountEmail: tenant.serviceAccountEmail || "",
      serviceAccountKey: "", // Don't prefill secret
      adminEmail: tenant.adminEmail || "",
      syncEnabled: tenant.syncEnabled,
      syncInterval: tenant.syncInterval,
      allowedDomains: tenant.allowedDomains.join(", "),
      autoProvision: tenant.autoProvision,

    });
    setShowTenantForm(true);
  }

  // Settings save
  async function saveSettings(category: string) {
    setSaving(true);
    try {
      const categorySettings = defaultSettings[category] || [];
      const settingsToSave = categorySettings.map(setting => ({
        category,
        key: setting.key,
        value: settingsForm[`${category}.${setting.key}`] || "",
        isSecret: setting.isSecret,
        description: setting.description,
      }));

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      toast.success(`${tabs.find(t => t.id === category)?.name} settings saved`);
      loadData();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateSettingsForm(category: string, key: string, value: string) {
    setSettingsForm(prev => ({ ...prev, [`${category}.${key}`]: value }));
  }

  function toggleSecret(key: string) {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Check if settings are configured
  function isConfigured(category: string): boolean {
    const categorySettings = defaultSettings[category] || [];
    const requiredKeys = categorySettings.filter(s => !s.key.includes("enabled")).slice(0, 2);
    return requiredKeys.some(s => settingsForm[`${category}.${s.key}`]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Plug className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Integrations</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Configure external service connections and API credentials
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Globe className="h-4 w-4" />
              <span className="font-semibold">{tenants.length}</span>
              <span className="text-white/80 text-sm">Tenants</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">{tabs.filter(t => t.id === "google" ? tenants.length > 0 : isConfigured(t.id)).length}</span>
              <span className="text-white/80 text-sm">Configured</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Server className="h-4 w-4" />
              <span className="font-semibold">{tabs.length}</span>
              <span className="text-white/80 text-sm">Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
              {tab.id === "google" && tenants.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded">
                  {tenants.length}
                </span>
              )}
              {tab.id !== "google" && isConfigured(tab.id) && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Google Workspace Tab */}
      {activeTab === "google" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Google Workspace Tenants
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure multiple Google Workspace organizations for user sync
              </p>
            </div>
            <button
              onClick={() => { resetTenantForm(); setEditingTenant(null); setShowTenantForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Tenant
            </button>
          </div>

          {/* Tenant Cards */}
          <div className="grid gap-4">
            {tenants.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Globe className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tenants configured</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Add a Google Workspace tenant to start syncing users
                </p>
              </div>
            ) : (
              tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className={cn(
                    "bg-white dark:bg-slate-800 rounded-2xl border p-6 transition-all",
                    tenant.isActive
                      ? "border-slate-200 dark:border-slate-700"
                      : "border-red-200 dark:border-red-900/50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        tenant.isActive
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                          : "bg-slate-400"
                      )}>
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {tenant.name}
                          {!tenant.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded">
                              Inactive
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{tenant.domain}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {tenant.serviceAccountKey && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Key className="h-3 w-3" /> Credentials configured
                            </span>
                          )}
                          {tenant._count && (
                            <span className="text-slate-500 dark:text-slate-400">
                              {tenant._count.employees} employees • {tenant._count.syncRuns} syncs
                            </span>
                          )}
                        </div>
                        {tenant.lastSyncAt && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Last sync: {new Date(tenant.lastSyncAt).toLocaleString()} 
                            {tenant.lastSyncStatus && ` (${tenant.lastSyncStatus})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerSync(tenant.id)}
                        disabled={!tenant.isActive}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Run sync now"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => editTenant(tenant)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Edit tenant"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTenant(tenant)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete tenant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sync settings summary */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Sync:</span>{" "}
                      <span className={tenant.syncEnabled ? "text-green-600 dark:text-green-400" : "text-slate-400"}>
                        {tenant.syncEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Interval:</span>{" "}
                      <span className="text-slate-900 dark:text-white">{tenant.syncInterval} min</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Auto-provision:</span>{" "}
                      <span className={tenant.autoProvision ? "text-green-600 dark:text-green-400" : "text-slate-400"}>
                        {tenant.autoProvision ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tenant Form Modal */}
          {showTenantForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => { setShowTenantForm(false); setEditingTenant(null); }}
              />
              {/* Modal */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900">
                  <h2 className="text-xl font-bold text-white">
                    {editingTenant ? "Edit Tenant" : "Add Google Workspace Tenant"}
                  </h2>
                  <button 
                    onClick={() => { setShowTenantForm(false); setEditingTenant(null); }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
                {/* Body */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tenantForm.name}
                        onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Main Office"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Domain <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tenantForm.domain}
                        onChange={e => setTenantForm(f => ({ ...f, domain: e.target.value }))}
                        placeholder="company.com"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-200">
                        <p className="font-medium">Service Account Setup Required</p>
                        <p className="mt-1">
                          To sync users, create a Service Account in Google Cloud Console with Domain-Wide Delegation
                          and enable the Admin SDK Directory API.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Service Account Email
                    </label>
                    <input
                      type="email"
                      value={tenantForm.serviceAccountEmail}
                      onChange={e => setTenantForm(f => ({ ...f, serviceAccountEmail: e.target.value }))}
                      placeholder="hr-sync@project.iam.gserviceaccount.com"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Service Account Key (JSON)
                      {editingTenant?.serviceAccountKey && (
                        <span className="ml-2 text-green-400 font-normal">✓ Already configured</span>
                      )}
                    </label>
                    <textarea
                      value={tenantForm.serviceAccountKey}
                      onChange={e => setTenantForm(f => ({ ...f, serviceAccountKey: e.target.value }))}
                      placeholder='{"type": "service_account", "project_id": "...", ...}'
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Admin Email (to impersonate)
                      </label>
                      <input
                        type="email"
                        value={tenantForm.adminEmail}
                        onChange={e => setTenantForm(f => ({ ...f, adminEmail: e.target.value }))}
                        placeholder="admin@company.com"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Customer ID (optional)
                      </label>
                      <input
                        type="text"
                        value={tenantForm.customerId}
                        onChange={e => setTenantForm(f => ({ ...f, customerId: e.target.value }))}
                        placeholder="C01234567"
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Sync Interval (minutes)
                    </label>
                    <input
                      type="number"
                      value={tenantForm.syncInterval}
                      onChange={e => setTenantForm(f => ({ ...f, syncInterval: parseInt(e.target.value) || 1440 }))}
                      min={60}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Minimum 60 minutes. Default: 1440 (24 hours)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Additional Allowed Domains (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tenantForm.allowedDomains}
                      onChange={e => setTenantForm(f => ({ ...f, allowedDomains: e.target.value }))}
                      placeholder="subsidiary.com, branch.company.com"
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tenantForm.syncEnabled}
                        onChange={e => setTenantForm(f => ({ ...f, syncEnabled: e.target.checked }))}
                        className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                      />
                      <span className="text-sm text-slate-300">Enable automatic sync</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tenantForm.autoProvision}
                        onChange={e => setTenantForm(f => ({ ...f, autoProvision: e.target.checked }))}
                        className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                      />
                      <span className="text-sm text-slate-300">Auto-provision new users</span>
                    </label>
                  </div>
                </div>
                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
                  <button
                    onClick={() => { setShowTenantForm(false); setEditingTenant(null); }}
                    className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTenant}
                    disabled={saving || !tenantForm.name || !tenantForm.domain}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {editingTenant ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Integration Tabs */}
      {activeTab !== "google" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                {(() => {
                  const TabIcon = tabs.find(t => t.id === activeTab)?.icon || Server;
                  return <TabIcon className="h-5 w-5 text-white" />;
                })()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {tabs.find(t => t.id === activeTab)?.name} Configuration
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure connection settings and credentials
                </p>
              </div>
            </div>
            <button
              onClick={() => saveSettings(activeTab)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>

          <div className="space-y-4">
            {(defaultSettings[activeTab] || []).map(setting => (
              <div key={setting.key} className="grid grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {setting.label}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {setting.description}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <input
                      type={setting.isSecret && !showSecrets[`${activeTab}.${setting.key}`] ? "password" : "text"}
                      value={settingsForm[`${activeTab}.${setting.key}`] || ""}
                      onChange={e => updateSettingsForm(activeTab, setting.key, e.target.value)}
                      placeholder={setting.placeholder || (setting.isSecret ? "••••••••" : "")}
                      className="w-full px-4 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    {setting.isSecret && (
                      <button
                        type="button"
                        onClick={() => toggleSecret(`${activeTab}.${setting.key}`)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showSecrets[`${activeTab}.${setting.key}`] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help section */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                Setup Instructions
              </h3>
              {activeTab === "mattermost" && (
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Create a bot account or get a Personal Access Token</li>
                  <li>Enable API access in System Console → Integrations</li>
                  <li>Add the bot to the team you want to use</li>
                </ul>
              )}
              {activeTab === "smtp" && (
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>For Gmail: Enable 2FA and create an App Password</li>
                  <li>Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)</li>
                  <li>Test connection after saving settings</li>
                </ul>
              )}
              {activeTab === "jira" && (
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>Create API token at id.atlassian.com/manage-profile/security/api-tokens</li>
                  <li>Set up webhook at Jira → Settings → Webhooks</li>
                  <li>Use Webhook Secret to validate incoming requests</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
