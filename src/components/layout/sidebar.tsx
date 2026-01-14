"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import {
  Home,
  Users,
  Settings,
  RefreshCw,
  Shield,
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
  Briefcase,
  ChevronDown,
  Link2,
  UserCircle,
  AlertTriangle,
  Upload,
  UserPlus,
  Landmark,
  Network,
  Search,
  Command,
  Plug,
} from "lucide-react";
import { useState } from "react";
import type { CurrentUser } from "@/types";
import { isAdmin, isHR } from "@/types";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface SidebarProps {
  user: CurrentUser;
}

const navigation = [
  { name: "Home", href: "/", icon: Home, roles: [] },
  { name: "Directory", href: "/directory", icon: Users, roles: [] },
  { name: "Org Chart", href: "/org-chart", icon: Network, roles: [] },
  { name: "Services", href: "/services", icon: Link2, roles: [] },
  { name: "My Profile", href: "/profile/me", icon: UserCircle, roles: [] },
  { name: "Settings", href: "/settings", icon: Settings, roles: [] },
];

const adminNavigation = [
  { name: "Departments", href: "/admin/departments", icon: Building2, roles: ["HR", "ADMIN"] },
  { name: "Positions", href: "/admin/positions", icon: Briefcase, roles: ["HR", "ADMIN"] },
  { name: "Legal Entities", href: "/admin/legal-entities", icon: Landmark, roles: ["HR", "ADMIN"] },
  { name: "Services", href: "/admin/services", icon: FileText, roles: ["HR", "ADMIN"] },
  { name: "Integrations", href: "/admin/integrations", icon: Plug, roles: ["ADMIN"] },
  { name: "Roles", href: "/admin/roles", icon: Shield, roles: ["ADMIN"] },
  { name: "Field Visibility", href: "/admin/field-visibility", icon: Settings, roles: ["ADMIN"] },
  { name: "Pending Access", href: "/admin/pending-access", icon: UserPlus, roles: ["HR", "ADMIN"] },
  { name: "Sync Runs", href: "/admin/sync", icon: RefreshCw, roles: ["HR", "ADMIN"] },
  { name: "CSV Import", href: "/admin/import", icon: Upload, roles: ["HR", "ADMIN"] },
  { name: "Problems", href: "/admin/problems", icon: AlertTriangle, roles: ["HR", "ADMIN"] },
  { name: "Audit Log", href: "/admin/audit", icon: FileText, roles: ["ADMIN"] },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));

  const showAdmin = isHR(user) || isAdmin(user);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden rounded-xl bg-white dark:bg-slate-800 p-2 shadow-lg dark:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 lg:translate-x-0 border-r border-slate-100 dark:border-slate-800",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 px-6">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">HR</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HR Portal</h1>
              <p className="text-xs text-indigo-200">Employee Directory</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="px-4 py-3">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                window.dispatchEvent(event);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-xs font-medium text-slate-400 border border-slate-200 dark:border-slate-600">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Section */}
            {showAdmin && (
              <div className="pt-6">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administration
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      adminOpen && "rotate-180"
                    )}
                  />
                </button>

                {adminOpen && (
                  <div className="mt-2 space-y-1">
                    {adminNavigation
                      .filter((item) => {
                        // Check if user has any of the required roles
                        return item.roles.some((role) => user.roles.includes(role as any));
                      })
                      .map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ml-2",
                              isActive
                                ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                                : "text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-3">
              <UserAvatar name={user.name} imageUrl={user.image} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <NotificationBell />
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
