import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { BirthdayWidget } from "@/components/dashboard/birthday-widget";
import { RecentEmployeesWidget } from "@/components/dashboard/recent-employees-widget";
import { getPageConfig, renderPageConfig } from "@/lib/page-renderer";
import { 
  Users, Building2, ExternalLink, Clock, CheckCircle2, 
  AlertTriangle, Link2, Briefcase, TrendingUp, Network,
  Calendar, Sparkles, ArrowRight
} from "lucide-react";
import Link from "next/link";

// Time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Day info
function getDayInfo(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

async function getStats() {
  const [employeeCount, departmentCount, activeCount, onLeaveCount, positionCount] = await Promise.all([
    db.employee.count({ where: { status: { not: "TERMINATED" } } }),
    db.department.count({ where: { isActive: true } }),
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.employee.count({ where: { status: { in: ["ON_LEAVE", "MATERNITY"] } } }),
    db.position.count({ where: { isActive: true } }),
  ]);

  return { employeeCount, departmentCount, activeCount, onLeaveCount, positionCount };
}

async function getAnalyticsData() {
  const [byLegalEntity, byDepartment, byStatusRaw, byTypeRaw, totalPositions] = await Promise.all([
    // By Legal Entity
    db.legalEntity.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        _count: { select: { employees: { where: { status: { not: "TERMINATED" } } } } },
      },
      orderBy: { name: "asc" },
    }),
    // By Department (top 6)
    db.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: { select: { employees: { where: { status: { not: "TERMINATED" } } } } },
      },
      orderBy: { employees: { _count: "desc" } },
      take: 6,
    }),
    // By Status
    db.employee.groupBy({
      by: ["status"],
      _count: true,
    }),
    // By Employment Type
    db.employee.groupBy({
      by: ["employmentType"],
      where: { status: { not: "TERMINATED" } },
      _count: true,
    }),
    // Total positions
    db.position.count({ where: { isActive: true } }),
  ]);

  return {
    byLegalEntity,
    byDepartment,
    byStatus: byStatusRaw.map((s: { status: string; _count: number }) => ({ status: s.status, _count: s._count })),
    byEmploymentType: byTypeRaw.map((t: { employmentType: string | null; _count: number }) => ({ 
      type: t.employmentType || "Unknown", 
      count: t._count 
    })).filter((t: { type: string }) => t.type !== "Unknown"),
    totalPositions,
  };
}

async function getAdminAlerts() {
  const [pendingProblems, unresolvedSyncErrors] = await Promise.all([
    db.problemRecord.count({ where: { isResolved: false } }),
    db.syncError.count({ where: { isResolved: false } }),
  ]);

  return { pendingProblems, unresolvedSyncErrors };
}

async function getServices(roles: string[]) {
  const services = await db.serviceLink.findMany({
    where: {
      isActive: true,
      OR: [
        { visibleRoles: { none: {} } }, // Visible to all if no roles specified
        { visibleRoles: { some: { role: { in: roles as any } } } },
      ],
    },
    include: {
      category: true,
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return services;
}

export default async function HomePage() {
  const session = await auth();
  
  // If no session, redirect to login
  if (!session?.user) {
    redirect("/login");
  }
  
  const user = session.user;
  const isHRorAdmin = user.roles?.includes("HR") || user.roles?.includes("ADMIN");
  
  // Check for custom page layout
  const customLayout = await getPageConfig("dashboard");
  
  // If custom layout exists, render it
  if (customLayout && customLayout.sections.length > 0) {
    const [stats, services] = await Promise.all([
      getStats(),
      getServices(user.roles),
    ]);

    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl shadow-purple-500/20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {user.name?.split(" ")[0]}! 
            </h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl">
              Custom layout active - configured by admin
            </p>
          </div>
        </div>

        {/* Custom Layout */}
        {renderPageConfig(customLayout)}
      </div>
    );
  }
  
  const [stats, services, adminAlerts, analyticsData] = await Promise.all([
    getStats(),
    getServices(user.roles),
    isHRorAdmin ? getAdminAlerts() : Promise.resolve({ pendingProblems: 0, unresolvedSyncErrors: 0 }),
    isHRorAdmin ? getAnalyticsData() : Promise.resolve(null),
  ]);

  // Group services by category
  interface ServiceItem {
    id: string;
    title: string;
    description: string | null;
    url: string;
    iconUrl: string | null;
    category: { name: string } | null;
  }
  const servicesByCategory: Record<string, ServiceItem[]> = {};
  for (const service of services) {
    const categoryName = service.category?.name || "Other";
    if (!servicesByCategory[categoryName]) servicesByCategory[categoryName] = [];
    servicesByCategory[categoryName].push(service);
  }

  return (
    <div className="space-y-8">
      {/* Welcome section - Premium Algonova style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="text-sm font-medium text-white/70">{getDayInfo()}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {getGreeting()}, {user.name?.split(" ")[0]}!
          </h1>
          <p className="mt-3 text-lg text-white/80 max-w-2xl">
            Your team is growing strong. Access services, explore the directory, and stay connected.
          </p>
        </div>

        {/* Quick stats - Enhanced grid */}
        <div className="relative mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-2.5 shadow-lg">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold">{stats.employeeCount}</p>
              </div>
              <p className="text-sm text-white/70 mt-2">Total Employees</p>
            </div>
          </div>
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 p-2.5 shadow-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </div>
                <p className="text-3xl font-bold">{stats.activeCount}</p>
              </div>
              <p className="text-sm text-white/70 mt-2">Active Now</p>
            </div>
          </div>
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-2.5 shadow-lg">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold">{stats.departmentCount}</p>
              </div>
              <p className="text-sm text-white/70 mt-2">Departments</p>
            </div>
          </div>
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-2.5 shadow-lg">
                  <Briefcase className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold">{stats.positionCount}</p>
              </div>
              <p className="text-sm text-white/70 mt-2">Positions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions - Premium cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/directory">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:border-indigo-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-110 transition-all">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Directory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Find colleagues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/org-chart">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-violet-500/10 dark:hover:border-violet-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 group-hover:scale-110 transition-all">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Org Chart
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Team structure</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/me">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:border-emerald-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    My Profile
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">View your info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/services">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-pink-500/10 dark:hover:border-pink-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
            <CardContent className="p-5">
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 p-3 shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/50 group-hover:scale-110 transition-all">
                  <Link2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Services
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Company tools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {isHRorAdmin && (adminAlerts.pendingProblems > 0 || adminAlerts.unresolvedSyncErrors > 0) ? (
          <Link href="/admin/problems">
            <Card className="group cursor-pointer bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:border-amber-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
              <CardContent className="p-5">
                <div className="flex flex-col items-start gap-3">
                  <div className="relative rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 group-hover:scale-110 transition-all">
                    <AlertTriangle className="h-5 w-5 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {adminAlerts.pendingProblems + adminAlerts.unresolvedSyncErrors}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      Issues
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Needs attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/settings">
            <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-500/10 dark:hover:border-slate-500/50 transition-all duration-300 rounded-2xl overflow-hidden h-full">
              <CardContent className="p-5">
                <div className="flex flex-col items-start gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 p-3 shadow-lg shadow-slate-500/30 group-hover:shadow-slate-500/50 group-hover:scale-110 transition-all">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                      Settings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preferences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Activity Feed, Birthdays & New Hires */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - takes 1 column */}
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>

        {/* Birthdays & New Hires - takes 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Birthdays */}
          <BirthdayWidget />

          {/* Recent Hires */}
          <RecentEmployeesWidget />
        </div>
      </div>

      {/* Analytics for HR/Admin */}
      {isHRorAdmin && analyticsData && (
        <AnalyticsSection data={analyticsData} />
      )}

      {/* Services - Premium Grid */}
      {Object.keys(servicesByCategory).length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Access Services</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your favorite tools and resources</p>
            </div>
            <Link href="/services" className="group flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <a
                    key={service.id}
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Card className="h-full bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 rounded-xl overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {service.title}
                              </h4>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                            {service.description && (
                              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          {service.iconUrl && (
                            <div className="flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 p-2 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                              <img
                                src={service.iconUrl}
                                alt=""
                                className="h-8 w-8 rounded"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-dashed">
          <CardHeader className="text-center py-12">
            <div className="mx-auto rounded-full bg-slate-200 dark:bg-slate-800 p-4 w-fit mb-4">
              <Link2 className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-slate-700 dark:text-slate-300">No Services Yet</CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              Service links will appear here once configured by your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
