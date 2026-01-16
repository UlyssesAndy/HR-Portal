"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { 
  UserCheck, 
  Palmtree, 
  MapPin, 
  Clock, 
  Users,
  Baby,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  params: Record<string, string>;
  color: string;
  activeColor: string;
}

const quickFilters: QuickFilter[] = [
  {
    id: "all",
    label: "All",
    icon: <Users className="h-4 w-4" />,
    params: {},
    color: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700",
    activeColor: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/30",
  },
  {
    id: "active",
    label: "Active",
    icon: <UserCheck className="h-4 w-4" />,
    params: { status: "ACTIVE" },
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40",
    activeColor: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30",
  },
  {
    id: "on_leave",
    label: "On Leave",
    icon: <Palmtree className="h-4 w-4" />,
    params: { status: "ON_LEAVE" },
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40",
    activeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/30",
  },
  {
    id: "maternity",
    label: "Maternity",
    icon: <Baby className="h-4 w-4" />,
    params: { status: "MATERNITY" },
    color: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800 dark:hover:bg-pink-900/40",
    activeColor: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-lg shadow-pink-500/30",
  },
  {
    id: "pending",
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    params: { status: "PENDING" },
    color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40",
    activeColor: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-lg shadow-blue-500/30",
  },
];

interface QuickFiltersProps {
  currentStatus?: string;
  counts?: {
    all: number;
    active: number;
    onLeave: number;
    maternity: number;
    pending: number;
  };
}

export function QuickFilters({ currentStatus, counts }: QuickFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleQuickFilter = (filter: QuickFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear status first
    params.delete("status");
    params.set("page", "1");
    
    // Apply new filter params
    Object.entries(filter.params).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`/directory?${params.toString()}`);
    });
  };

  const isActive = (filter: QuickFilter) => {
    if (filter.id === "all") {
      return !currentStatus;
    }
    return filter.params.status === currentStatus;
  };

  const getCount = (filterId: string) => {
    if (!counts) return null;
    switch (filterId) {
      case "all": return counts.all;
      case "active": return counts.active;
      case "on_leave": return counts.onLeave;
      case "maternity": return counts.maternity;
      case "pending": return counts.pending;
      default: return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => {
        const active = isActive(filter);
        const count = getCount(filter.id);
        
        return (
          <button
            key={filter.id}
            onClick={() => handleQuickFilter(filter)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
              active ? filter.activeColor : filter.color,
              isPending && "opacity-50 cursor-wait"
            )}
          >
            {filter.icon}
            <span>{filter.label}</span>
            {count !== null && (
              <span className={cn(
                "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                active 
                  ? "bg-white/20" 
                  : "bg-slate-900/10 dark:bg-white/10"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
