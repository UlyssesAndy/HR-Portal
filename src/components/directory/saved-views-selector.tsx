"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Bookmark, 
  Plus, 
  Star, 
  Globe, 
  Trash2, 
  ChevronDown,
  Check,
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface SavedView {
  id: string;
  name: string;
  description?: string;
  isShared: boolean;
  isDefault: boolean;
  filters: Record<string, string>;
  icon?: string;
  color?: string;
  usageCount: number;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface SavedViewsSelectorProps {
  currentUserId: string;
}

export function SavedViewsSelector({ currentUserId }: SavedViewsSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [views, setViews] = useState<SavedView[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewShared, setNewViewShared] = useState(false);
  const [newViewDefault, setNewViewDefault] = useState(false);

  // Fetch saved views
  useEffect(() => {
    async function fetchViews() {
      try {
        const res = await fetch("/api/saved-views");
        if (res.ok) {
          const data = await res.json();
          setViews(data.views);
        }
      } catch (error) {
        console.error("Failed to fetch saved views:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchViews();
  }, []);

  // Apply a saved view
  const applyView = (view: SavedView) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    
    Object.entries(view.filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/directory?${params.toString()}`);
    });
    
    setIsOpen(false);
    
    // Track usage (fire and forget)
    fetch(`/api/saved-views/${view.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usageCount: view.usageCount + 1 }),
    });
  };

  // Create new view from current filters
  const createView = async () => {
    if (!newViewName.trim()) {
      toast.error("Please enter a name for the view");
      return;
    }

    // Collect current filters
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "page") {
        filters[key] = value;
      }
    });

    try {
      const res = await fetch("/api/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newViewName,
          filters,
          isShared: newViewShared,
          isDefault: newViewDefault,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setViews([data.view, ...views]);
        setShowCreateModal(false);
        setNewViewName("");
        setNewViewShared(false);
        setNewViewDefault(false);
        toast.success("View saved successfully!");
      } else {
        toast.error("Failed to save view");
      }
    } catch (error) {
      console.error("Error creating view:", error);
      toast.error("Failed to save view");
    }
  };

  // Delete a view
  const deleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this saved view?")) return;

    try {
      const res = await fetch(`/api/saved-views/${viewId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setViews(views.filter(v => v.id !== viewId));
        toast.success("View deleted");
      } else {
        toast.error("Failed to delete view");
      }
    } catch (error) {
      console.error("Error deleting view:", error);
      toast.error("Failed to delete view");
    }
  };

  // Check if current filters match a view
  const getCurrentFiltersHash = () => {
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "page") {
        filters[key] = value;
      }
    });
    return JSON.stringify(filters);
  };

  const currentHash = getCurrentFiltersHash();
  const activeView = views.find(v => JSON.stringify(v.filters) === currentHash);

  const hasFilters = searchParams.toString().replace(/page=\d+&?/, "").length > 0;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-all",
          activeView
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        )}
      >
        <Bookmark className="h-4 w-4" />
        <span className="hidden sm:inline">
          {activeView ? activeView.name : "Saved Views"}
        </span>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Saved Views</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick access to your filter presets</p>
            </div>

            {/* Views List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : views.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No saved views yet
                </div>
              ) : (
                <div className="py-1">
                  {views.map((view) => {
                    const isActive = JSON.stringify(view.filters) === currentHash;
                    const isOwner = view.user.id === currentUserId;
                    
                    return (
                      <button
                        key={view.id}
                        onClick={() => applyView(view)}
                        className={cn(
                          "w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                          isActive && "bg-indigo-50 dark:bg-indigo-900/20"
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          isActive 
                            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" 
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        )}>
                          {view.isDefault ? (
                            <Star className="h-4 w-4" />
                          ) : view.isShared ? (
                            <Globe className="h-4 w-4" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium truncate",
                              isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-white"
                            )}>
                              {view.name}
                            </span>
                            {isActive && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {!isOwner && (
                              <span>by {view.user.fullName}</span>
                            )}
                            <span>{Object.keys(view.filters).length} filters</span>
                          </div>
                        </div>
                        
                        {/* Delete (only for owner) */}
                        {isOwner && (
                          <button
                            onClick={(e) => deleteView(view.id, e)}
                            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create New */}
            {hasFilters && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Save Current Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Save View
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  View Name
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Active Engineers"
                  className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newViewShared}
                    onChange={(e) => setNewViewShared(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">Share with team</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Others can use this view</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newViewDefault}
                    onChange={(e) => setNewViewDefault(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">Set as default</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Auto-apply on Directory load</p>
                  </div>
                </label>
              </div>

              {/* Current Filters Preview */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Current Filters:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(searchParams.entries())
                    .filter(([key]) => key !== "page")
                    .map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                      >
                        {key}: {value}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="h-10 px-4 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createView}
                className="h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors"
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
