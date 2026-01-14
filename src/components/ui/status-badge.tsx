"use client";

import { useState } from "react";
import {
  Coffee, Laptop, Video, Plane, Moon, HeartPulse, 
  Clock, CheckCircle, X, ChevronDown
} from "lucide-react";

export type PresenceStatus = "available" | "busy" | "meeting" | "break" | "vacation" | "sick" | "offline";

interface StatusBadgeProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  editable?: boolean;
  onStatusChange?: (status: PresenceStatus) => void;
}

const STATUS_CONFIG: Record<PresenceStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  ringColor: string;
  icon: React.ReactNode;
}> = {
  available: {
    label: "Available",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    ringColor: "ring-green-500",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  busy: {
    label: "Busy",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    ringColor: "ring-red-500",
    icon: <X className="h-3 w-3" />,
  },
  meeting: {
    label: "In Meeting",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    ringColor: "ring-purple-500",
    icon: <Video className="h-3 w-3" />,
  },
  break: {
    label: "On Break",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    ringColor: "ring-amber-500",
    icon: <Coffee className="h-3 w-3" />,
  },
  vacation: {
    label: "Vacation",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    ringColor: "ring-blue-500",
    icon: <Plane className="h-3 w-3" />,
  },
  sick: {
    label: "Sick Leave",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    ringColor: "ring-orange-500",
    icon: <HeartPulse className="h-3 w-3" />,
  },
  offline: {
    label: "Offline",
    color: "text-slate-500 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-700",
    ringColor: "ring-slate-400",
    icon: <Moon className="h-3 w-3" />,
  },
};

export function StatusBadge({ 
  status, 
  size = "md", 
  showLabel = false,
  editable = false,
  onStatusChange,
}: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  if (editable) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full transition-all
            ${config.bgColor} ${config.color} hover:ring-2 ${config.ringColor}
          `}
        >
          <span className={`${sizeClasses[size]} rounded-full ${config.color.replace("text-", "bg-")}`} />
          <span className="text-xs font-medium">{config.label}</span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 min-w-[160px]">
              {(Object.keys(STATUS_CONFIG) as PresenceStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange?.(s);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                    hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                    ${status === s ? STATUS_CONFIG[s].bgColor : ""}
                  `}
                >
                  <span className={`h-3 w-3 rounded-full ${STATUS_CONFIG[s].color.replace("text-", "bg-")}`} />
                  <span className={status === s ? "font-medium" : ""}>{STATUS_CONFIG[s].label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}>
        <span className={`${sizeClasses[size]} rounded-full ${config.color.replace("text-", "bg-")}`} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} rounded-full ring-2 ring-white dark:ring-slate-800 ${config.color.replace("text-", "bg-")}`}
      title={config.label}
    />
  );
}

// Dot indicator for avatar overlay
export function StatusDot({ status, className = "" }: { status: PresenceStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  return (
    <span 
      className={`
        absolute bottom-0 right-0 block h-3 w-3 rounded-full 
        ring-2 ring-white dark:ring-slate-800
        ${config.color.replace("text-", "bg-")}
        ${className}
      `}
      title={config.label}
    />
  );
}
