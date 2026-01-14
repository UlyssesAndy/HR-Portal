"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, PieChart, TrendingUp, Users, Building2, Briefcase, 
  Landmark, UserCheck, UserMinus, Baby, Plane
} from "lucide-react";

interface LegalEntityStat {
  id: string;
  name: string;
  shortName: string | null;
  _count: { employees: number };
}

interface DepartmentStat {
  id: string;
  name: string;
  _count: { employees: number };
}

interface StatusStat {
  status: string;
  _count: number;
}

interface AnalyticsData {
  byLegalEntity: LegalEntityStat[];
  byDepartment: DepartmentStat[];
  byStatus: StatusStat[];
  byEmploymentType: { type: string; count: number }[];
  totalPositions: number;
}

interface AnalyticsSectionProps {
  data: AnalyticsData;
}

const statusColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  ACTIVE: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", icon: UserCheck },
  ON_LEAVE: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", icon: Plane },
  MATERNITY: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", icon: Baby },
  TERMINATED: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400", icon: UserMinus },
  PROBATION: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: Users },
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  MATERNITY: "Maternity",
  TERMINATED: "Terminated",
  PROBATION: "Probation",
};

const chartColors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
];

export function AnalyticsSection({ data }: AnalyticsSectionProps) {
  const totalEmployees = data.byStatus.reduce((sum, s) => sum + s._count, 0);
  const activeStatuses = data.byStatus.filter(s => s.status !== "TERMINATED");
  const activeTotal = activeStatuses.reduce((sum, s) => sum + s._count, 0);

  // Calculate max for bars
  const maxLegalEntity = Math.max(...data.byLegalEntity.map(le => le._count.employees), 1);
  const maxDepartment = Math.max(...data.byDepartment.map(d => d._count.employees), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Legal Entity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-indigo-500" />
              By Legal Entity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byLegalEntity.length > 0 ? (
              <div className="space-y-3">
                {data.byLegalEntity.map((le, idx) => {
                  const percentage = (le._count.employees / activeTotal) * 100;
                  const barWidth = (le._count.employees / maxLegalEntity) * 100;
                  return (
                    <div key={le.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                          {le.shortName || le.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {le._count.employees} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${chartColors[idx % chartColors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No legal entities configured</p>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-emerald-500" />
              By Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeStatuses.map((stat) => {
                const config = statusColors[stat.status] || statusColors.ACTIVE;
                const Icon = config.icon;
                const percentage = ((stat._count / activeTotal) * 100).toFixed(0);
                return (
                  <div
                    key={stat.status}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${config.text}`} />
                    <div>
                      <p className={`text-sm font-semibold ${config.text}`}>
                        {stat._count}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {statusLabels[stat.status] || stat.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Visual pie representation */}
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                  {(() => {
                    let cumulative = 0;
                    return activeStatuses.map((stat, idx) => {
                      const percentage = (stat._count / activeTotal) * 100;
                      const offset = cumulative;
                      cumulative += percentage;
                      const colors = ["#10b981", "#f59e0b", "#ec4899", "#6366f1", "#06b6d4"];
                      return (
                        <circle
                          key={stat.status}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="transparent"
                          stroke={colors[idx % colors.length]}
                          strokeWidth="3"
                          strokeDasharray={`${percentage} ${100 - percentage}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{activeTotal}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {activeStatuses.slice(0, 4).map((stat, idx) => {
                  const colors = ["bg-emerald-500", "bg-amber-500", "bg-pink-500", "bg-indigo-500"];
                  return (
                    <div key={stat.status} className="flex items-center gap-2 text-xs">
                      <div className={`h-2 w-2 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="text-slate-600 dark:text-slate-300">{statusLabels[stat.status] || stat.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Departments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-blue-500" />
              Top Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byDepartment.length > 0 ? (
              <div className="space-y-3">
                {data.byDepartment.slice(0, 6).map((dept, idx) => {
                  const barWidth = (dept._count.employees / maxDepartment) * 100;
                  return (
                    <div key={dept.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                          {dept.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {dept._count.employees}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${chartColors[idx % chartColors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No departments configured</p>
            )}
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Employment Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {data.byEmploymentType.map((type, idx) => (
                <div
                  key={type.type}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4"
                >
                  <div className="relative z-10">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{type.count}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{type.type.toLowerCase().replace("_", " ")}</p>
                  </div>
                  <div 
                    className={`absolute bottom-0 right-0 h-16 w-16 rounded-full ${chartColors[idx % chartColors.length]} opacity-10 blur-xl`}
                  />
                </div>
              ))}
            </div>
            
            {/* Positions count */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  {data.totalPositions} Unique Positions
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Across all departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
