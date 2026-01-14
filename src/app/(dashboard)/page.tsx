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
import { 
  Users, Building2, ExternalLink, Clock, CheckCircle2, 
  AlertTriangle, Link2
} from "lucide-react";
import Link from "next/link";

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
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user.name?.split(" ")[0]}! 
          </h1>
          <p className="mt-3 text-lg text-white/80 max-w-2xl">
            Access your company services, explore the employee directory, and stay connected with your team.
          </p>
        </div>

        {/* Quick stats */}
        <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-3 shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.employeeCount}</p>
                <p className="text-sm text-white/70">Total Employees</p>
              </div>
            </div>
          </div>
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-3 shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.departmentCount}</p>
                <p className="text-sm text-white/70">Departments</p>
              </div>
            </div>
          </div>
          <div className="group rounded-2xl bg-white/10 backdrop-blur-sm p-5 border border-white/10 hover:bg-white/20 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-white/30 to-white/10 p-3 shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.activeCount}</p>
                <p className="text-sm text-white/70">Active Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions - Premium cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/directory">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:border-indigo-500/50 transition-all duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Employee Directory
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Find colleagues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/me">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:border-emerald-500/50 transition-all duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    My Profile
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">View your info</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/services">
          <Card className="group cursor-pointer bg-white dark:bg-slate-900/50 dark:border-slate-800 hover:shadow-xl hover:shadow-pink-500/10 dark:hover:border-pink-500/50 transition-all duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 p-3 shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/50 transition-shadow">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Services Hub
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">All company tools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {isHRorAdmin && (adminAlerts.pendingProblems > 0 || adminAlerts.unresolvedSyncErrors > 0) && (
          <Link href="/admin/problems">
            <Card className="group cursor-pointer bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:border-amber-500/50 transition-all duration-300 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {adminAlerts.pendingProblems + adminAlerts.unresolvedSyncErrors} Issues
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Requires attention</p>
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

      {/* Services */}
      {Object.keys(servicesByCategory).length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Services</h2>
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
                    <Card className="h-full hover:border-blue-200 hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {service.title}
                              </h4>
                              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            {service.description && (
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          {service.iconUrl && (
                            <img
                              src={service.iconUrl}
                              alt=""
                              className="h-10 w-10 rounded-lg"
                            />
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
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              No services configured yet. Contact your administrator to add service links.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
