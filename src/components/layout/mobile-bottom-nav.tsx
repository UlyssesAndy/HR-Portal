"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Network, Settings, Search } from "lucide-react";

const mobileNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Directory", href: "/directory", icon: Users },
  { name: "Search", href: "#search", icon: Search, action: "search" },
  { name: "Org Chart", href: "/org-chart", icon: Network },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const handleClick = (item: typeof mobileNavItems[0], e: React.MouseEvent) => {
    if (item.action === "search") {
      e.preventDefault();
      const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      window.dispatchEvent(event);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 safe-area-inset">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          const isActive = item.href !== "#search" && pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleClick(item, e)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-feedback",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive && (
                <span className="absolute -top-0.5 w-1 h-1 bg-indigo-600 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
