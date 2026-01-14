"use client";

import { cn } from "@/lib/utils";
import React from "react";

// Responsive grid that adapts to screen size
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ResponsiveGrid({
  children,
  className = "",
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}: ResponsiveGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return (
    <div
      className={cn(
        "grid",
        `gap-${gap}`,
        cols.default && gridCols[cols.default as keyof typeof gridCols],
        cols.sm && `sm:${gridCols[cols.sm as keyof typeof gridCols]}`,
        cols.md && `md:${gridCols[cols.md as keyof typeof gridCols]}`,
        cols.lg && `lg:${gridCols[cols.lg as keyof typeof gridCols]}`,
        cols.xl && `xl:${gridCols[cols.xl as keyof typeof gridCols]}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Page header component with responsive sizing
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  badge,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 animate-fadeIn",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// Mobile-friendly tabs
interface MobileTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function MobileTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: MobileTabsProps) {
  return (
    <div
      className={cn(
        "flex overflow-x-auto gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl -mx-4 px-4 sm:mx-0 sm:px-1 hide-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all touch-feedback",
            activeTab === tab.id
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Collapsible section for mobile
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-b border-slate-200 dark:border-slate-700", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left touch-feedback"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {title}
        </span>
        <svg
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[2000px] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Pull to refresh indicator
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const startY = React.useRef(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min((currentY - startY.current) * 0.5, 80));
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(40);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("relative overflow-auto", className)}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-transform duration-200 z-10"
        style={{ 
          transform: `translateX(-50%) translateY(${pullDistance - 40}px)`,
          opacity: pullDistance > 20 ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full",
            isRefreshing && "animate-spin"
          )}
        />
      </div>
      {/* Content */}
      <div
        style={{ transform: `translateY(${isRefreshing ? 40 : pullDistance}px)` }}
        className="transition-transform duration-200"
      >
        {children}
      </div>
    </div>
  );
}

// Action sheet for mobile
interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: { label: string; icon?: React.ReactNode; onClick: () => void; destructive?: boolean }[];
}

export function ActionSheet({ isOpen, onClose, title, actions }: ActionSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-3xl p-4 pb-8 safe-area-inset animate-slideInUp">
        {title && (
          <div className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
            {title}
          </div>
        )}
        <div className="space-y-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-colors touch-feedback",
                action.destructive
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-feedback"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

// Floating action button
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40",
        "flex items-center gap-2 px-4 py-4 rounded-full",
        "bg-gradient-to-r from-blue-500 to-indigo-600",
        "text-white font-medium shadow-xl shadow-blue-500/30",
        "hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105",
        "active:scale-95 transition-all duration-200 touch-feedback",
        "animate-bounceIn",
        className
      )}
      aria-label={label}
    >
      {icon}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

// Hide scrollbar utility style
const hideScrollbarStyle = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

// Add the style to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = hideScrollbarStyle;
  document.head.appendChild(style);
}
