"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Home, Users, Network, FileText, Settings, Building2, 
  Briefcase, Shield, Upload, Landmark, UserCircle, X,
  Command
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  section: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Commands
  const commands: CommandItem[] = [
    // Navigation
    { id: "home", title: "Go to Dashboard", icon: <Home className="h-4 w-4" />, action: () => router.push("/"), section: "Navigation", keywords: ["home", "dashboard"] },
    { id: "directory", title: "Go to Directory", icon: <Users className="h-4 w-4" />, action: () => router.push("/directory"), section: "Navigation", keywords: ["employees", "people", "staff"] },
    { id: "orgchart", title: "Go to Org Chart", icon: <Network className="h-4 w-4" />, action: () => router.push("/org-chart"), section: "Navigation", keywords: ["organization", "hierarchy", "structure"] },
    { id: "services", title: "Go to Services", icon: <FileText className="h-4 w-4" />, action: () => router.push("/services"), section: "Navigation", keywords: ["links", "resources"] },
    { id: "profile", title: "Go to My Profile", icon: <UserCircle className="h-4 w-4" />, action: () => router.push("/profile/me"), section: "Navigation", keywords: ["me", "account"] },
    { id: "settings", title: "Go to Settings", icon: <Settings className="h-4 w-4" />, action: () => router.push("/settings"), section: "Navigation", keywords: ["preferences", "account"] },
    
    // Admin
    { id: "admin-dept", title: "Manage Departments", icon: <Building2 className="h-4 w-4" />, action: () => router.push("/admin/departments"), section: "Admin", keywords: ["departments", "teams"] },
    { id: "admin-pos", title: "Manage Positions", icon: <Briefcase className="h-4 w-4" />, action: () => router.push("/admin/positions"), section: "Admin", keywords: ["jobs", "titles", "roles"] },
    { id: "admin-le", title: "Manage Legal Entities", icon: <Landmark className="h-4 w-4" />, action: () => router.push("/admin/legal-entities"), section: "Admin", keywords: ["companies", "entities"] },
    { id: "admin-roles", title: "Manage Roles", icon: <Shield className="h-4 w-4" />, action: () => router.push("/admin/roles"), section: "Admin", keywords: ["permissions", "access"] },
    { id: "admin-import", title: "Import CSV", icon: <Upload className="h-4 w-4" />, action: () => router.push("/admin/csv-import"), section: "Admin", keywords: ["upload", "bulk", "data"] },
  ];

  // Filter commands
  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : commands;

  // Group by section
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = [];
    acc[cmd.section].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigate with arrow keys
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      setIsOpen(false);
    }
  }, [filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
            <Search className="h-5 w-5 text-indigo-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyNavigation}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-lg"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-80 overflow-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Command className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([section, items]) => (
                <div key={section} className="mb-4 last:mb-0">
                  <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section}
                  </p>
                  {items.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => { cmd.action(); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          globalIdx === selectedIndex 
                            ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className={globalIdx === selectedIndex ? "text-indigo-500" : "text-slate-400"}>
                          {cmd.icon}
                        </span>
                        <span className="flex-1 text-left font-medium">{cmd.title}</span>
                        {globalIdx === selectedIndex && (
                          <span className="text-xs text-slate-400">↵ to select</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">K</kbd>
              to toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
