"use client";

import { useEffect, useState } from "react";
import { X, Command, Search, Moon, Sun, Home, Users, Settings, LogOut, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["Ctrl", "K"], description: "Open search / command palette", icon: <Search className="h-4 w-4" />, category: "Navigation" },
  { keys: ["G", "H"], description: "Go to Home", icon: <Home className="h-4 w-4" />, category: "Navigation" },
  { keys: ["G", "D"], description: "Go to Directory", icon: <Users className="h-4 w-4" />, category: "Navigation" },
  { keys: ["G", "O"], description: "Go to Org Chart", icon: <Network className="h-4 w-4" />, category: "Navigation" },
  { keys: ["G", "S"], description: "Go to Settings", icon: <Settings className="h-4 w-4" />, category: "Navigation" },
  
  // Actions
  { keys: ["Ctrl", "D"], description: "Toggle dark mode", icon: <Moon className="h-4 w-4" />, category: "Actions" },
  { keys: ["Escape"], description: "Close dialog / Cancel", category: "Actions" },
  { keys: ["?"], description: "Show this help", category: "Actions" },
  
  // Directory
  { keys: ["/"], description: "Focus search in directory", icon: <Search className="h-4 w-4" />, category: "Directory" },
  { keys: ["Ctrl", "E"], description: "Export employees", category: "Directory" },
  
  // Org Chart
  { keys: ["+"], description: "Zoom in", category: "Org Chart" },
  { keys: ["-"], description: "Zoom out", category: "Org Chart" },
  { keys: ["0"], description: "Reset zoom", category: "Org Chart" },
  { keys: ["H"], description: "Toggle horizontal layout", category: "Org Chart" },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [...new Set(shortcuts.map((s) => s.category))];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-auto sm:w-full sm:max-w-2xl max-h-[90vh] overflow-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Navigate faster with these shortcuts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {shortcut.icon && (
                            <span className="text-slate-400 dark:text-slate-500">
                              {shortcut.icon}
                            </span>
                          )}
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {shortcut.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <kbd
                                className={cn(
                                  "px-2 py-1 text-xs font-medium rounded-lg",
                                  "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                                  "border border-slate-200 dark:border-slate-600",
                                  "shadow-sm"
                                )}
                              >
                                {key === "Ctrl" && (
                                  <span className="mr-0.5">⌘</span>
                                )}
                                {key !== "Ctrl" && key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-slate-400 dark:text-slate-500 text-xs">
                                  +
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Press <kbd className="px-1.5 py-0.5 mx-1 text-xs bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">?</kbd> anywhere to show this dialog
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manage keyboard shortcuts help state
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on ? key (shift + /)
      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
