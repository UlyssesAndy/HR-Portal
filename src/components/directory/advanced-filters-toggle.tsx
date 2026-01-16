"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvancedFiltersToggleProps {
  children: React.ReactNode;
  hasActiveFilters?: boolean;
}

export function AdvancedFiltersToggle({ children, hasActiveFilters }: AdvancedFiltersToggleProps) {
  const [isOpen, setIsOpen] = useState(hasActiveFilters ?? false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-all duration-200",
          isOpen 
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700",
          hasActiveFilters && !isOpen && "ring-2 ring-indigo-500/20"
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Advanced Filters</span>
        {hasActiveFilters && (
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-1" />
        )}
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
}
