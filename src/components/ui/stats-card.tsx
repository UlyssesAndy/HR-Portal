"use client";

import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./page-transition";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "slate";
  className?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  previousValue,
  prefix = "",
  suffix = "",
  icon,
  color = "blue",
  className = "",
  loading = false,
}: StatsCardProps) {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  const colorClasses = {
    blue: {
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      icon: "text-blue-600 dark:text-blue-400",
      ring: "ring-blue-500/20",
    },
    green: {
      bg: "bg-green-500/10 dark:bg-green-500/20",
      icon: "text-green-600 dark:text-green-400",
      ring: "ring-green-500/20",
    },
    red: {
      bg: "bg-red-500/10 dark:bg-red-500/20",
      icon: "text-red-600 dark:text-red-400",
      ring: "ring-red-500/20",
    },
    yellow: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      icon: "text-amber-600 dark:text-amber-400",
      ring: "ring-amber-500/20",
    },
    purple: {
      bg: "bg-purple-500/10 dark:bg-purple-500/20",
      icon: "text-purple-600 dark:text-purple-400",
      ring: "ring-purple-500/20",
    },
    slate: {
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      icon: "text-slate-600 dark:text-slate-400",
      ring: "ring-slate-500/20",
    },
  };

  const colors = colorClasses[color];

  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg animate-pulse",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-lg transition-all hover:shadow-xl hover-lift animate-fadeIn",
        className
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl opacity-20",
          colors.bg
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {prefix}
            <AnimatedCounter value={value} />
            {suffix}
          </p>

          {previousValue !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  isPositive && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                  isNegative && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                  !isPositive && !isNegative && "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}
              >
                {isPositive && <ArrowUp className="h-3 w-3" />}
                {isNegative && <ArrowDown className="h-3 w-3" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                vs last period
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ring-1",
              colors.bg,
              colors.icon,
              colors.ring
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini stat for inline display
interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MiniStat({
  label,
  value,
  icon,
  trend,
  className = "",
}: MiniStatProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800",
        className
      )}
    >
      {icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-500 dark:text-slate-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
          {value}
          {trend === "up" && (
            <ArrowUp className="h-3 w-3 text-green-500" />
          )}
          {trend === "down" && (
            <ArrowDown className="h-3 w-3 text-red-500" />
          )}
        </p>
      </div>
    </div>
  );
}

// Stats grid for multiple stats
interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ children, className = "" }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 stagger-children",
        className
      )}
    >
      {children}
    </div>
  );
}
