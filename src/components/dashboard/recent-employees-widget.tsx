"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentEmployee {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  position: { title: string } | null;
  department: { name: string } | null;
  hireDate: string | null;
  createdAt: string;
}

export function RecentEmployeesWidget() {
  const [employees, setEmployees] = useState<RecentEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/employees/recent?limit=5");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees || []);
        }
      } catch (error) {
        console.error("Failed to load recent employees:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Recent Hires</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : employees.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">
          No recent hires
        </p>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <Link
              key={emp.id}
              href={`/profile/${emp.id}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <UserAvatar 
                name={emp.fullName} 
                imageUrl={emp.avatarUrl}
                className="h-10 w-10"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                  {emp.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {emp.position?.title || "No position"} • {emp.department?.name || "No dept"}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(emp.hireDate || emp.createdAt), { addSuffix: true })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
