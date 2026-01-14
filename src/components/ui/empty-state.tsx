"use client";

import { 
  Users, Search, FileText, Inbox, Calendar, 
  Bell, Settings, FolderOpen, Database, Filter
} from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Generic Empty State Component
 */
export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/**
 * Pre-configured empty states for common scenarios
 */
export function NoResultsEmpty({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-slate-400" />}
      title="No results found"
      description={query 
        ? `No results match "${query}". Try adjusting your search or filters.`
        : "No items match your current filters. Try adjusting them."
      }
    />
  );
}

export function NoEmployeesEmpty() {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-slate-400" />}
      title="No employees yet"
      description="Start by adding your first employee or import from CSV."
    />
  );
}

export function NoDataEmpty() {
  return (
    <EmptyState
      icon={<Database className="h-8 w-8 text-slate-400" />}
      title="No data available"
      description="There's nothing to show here yet. Check back later."
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon={<Bell className="h-8 w-8 text-slate-400" />}
      title="All caught up!"
      description="You have no new notifications."
    />
  );
}

export function NoEventsEmpty() {
  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8 text-slate-400" />}
      title="No events"
      description="There are no events scheduled for this period."
    />
  );
}

export function NoFilesEmpty() {
  return (
    <EmptyState
      icon={<FolderOpen className="h-8 w-8 text-slate-400" />}
      title="No files"
      description="No files have been uploaded yet."
    />
  );
}

export function FilteredEmpty() {
  return (
    <EmptyState
      icon={<Filter className="h-8 w-8 text-slate-400" />}
      title="No matches"
      description="No items match your current filters. Try removing some filters."
    />
  );
}

/**
 * Illustrated empty state with SVG
 */
export function IllustratedEmptyState({
  title,
  description,
  action,
  type = "general",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  type?: "general" | "search" | "error" | "success";
}) {
  const illustrations = {
    general: (
      <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" className="fill-slate-100 dark:fill-slate-800" />
        <rect x="60" y="70" width="80" height="60" rx="8" className="fill-slate-200 dark:fill-slate-700" />
        <rect x="70" y="85" width="40" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
        <rect x="70" y="95" width="60" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
        <rect x="70" y="105" width="30" height="4" rx="2" className="fill-slate-300 dark:fill-slate-600" />
        <circle cx="140" cy="140" r="25" className="fill-blue-100 dark:fill-blue-900/50" />
        <path d="M135 140 L140 145 L150 135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-blue-500" />
      </svg>
    ),
    search: (
      <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" className="fill-slate-100 dark:fill-slate-800" />
        <circle cx="90" cy="90" r="35" strokeWidth="6" className="stroke-slate-300 dark:stroke-slate-600" fill="none" />
        <line x1="115" y1="115" x2="140" y2="140" strokeWidth="6" strokeLinecap="round" className="stroke-slate-300 dark:stroke-slate-600" />
        <circle cx="90" cy="90" r="15" className="fill-slate-200 dark:fill-slate-700" />
      </svg>
    ),
    error: (
      <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" className="fill-red-50 dark:fill-red-900/20" />
        <circle cx="100" cy="100" r="40" className="fill-red-100 dark:fill-red-900/40" />
        <path d="M85 85 L115 115 M115 85 L85 115" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-red-400" />
      </svg>
    ),
    success: (
      <svg className="w-48 h-48" viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="80" className="fill-green-50 dark:fill-green-900/20" />
        <circle cx="100" cy="100" r="40" className="fill-green-100 dark:fill-green-900/40" />
        <path d="M80 100 L95 115 L125 85" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {illustrations[type]}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-4 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
