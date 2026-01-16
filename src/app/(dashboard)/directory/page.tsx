import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { fuzzySearchEmployees, getUniqueLocations, getManagers } from "@/lib/search";
import { DirectorySearch } from "@/components/directory/directory-search";
import { DirectoryFilters } from "@/components/directory/directory-filters";
import { QuickFilters } from "@/components/directory/quick-filters";
import { AdvancedFiltersToggle } from "@/components/directory/advanced-filters-toggle";
import { SavedViewsSelector } from "@/components/directory/saved-views-selector";
import { ExportButton } from "@/components/directory/export-button";
import { BulkActionsDirectory } from "@/components/directory/bulk-actions-directory";
import { Users, UserCheck, Building2, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface SearchParams {
  q?: string;
  department?: string;
  status?: string;
  manager?: string;
  location?: string;
  legalEntity?: string;
  page?: string;
}

async function getEmployees(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  
  // Use fuzzy search
  return fuzzySearchEmployees({
    query: searchParams.q || "",
    departmentId: searchParams.department,
    status: searchParams.status,
    managerId: searchParams.manager,
    location: searchParams.location,
    legalEntityId: searchParams.legalEntity,
    page,
    perPage: 12,
  });
}

async function getDepartments() {
  return db.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

async function getLegalEntities() {
  return db.legalEntity.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      shortName: true,
    },
  });
}

async function getStats() {
  const [total, active, onLeave, maternity, pending, departments] = await Promise.all([
    db.employee.count({ where: { status: { not: "TERMINATED" } } }),
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.employee.count({ where: { status: "ON_LEAVE" } }),
    db.employee.count({ where: { status: "MATERNITY" } }),
    db.employee.count({ where: { status: "PENDING" } }),
    db.department.count({ where: { isActive: true } }),
  ]);
  return { 
    total, 
    active, 
    onLeave, 
    maternity,
    pending,
    departments,
    // For quick filters
    counts: {
      all: total,
      active,
      onLeave,
      maternity,
      pending,
    }
  };
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canBulkEdit = session.user.roles?.includes("HR") || session.user.roles?.includes("ADMIN");

  const params = await searchParams;
  const [{ employees, pagination }, departments, managers, locations, legalEntities, stats] = await Promise.all([
    getEmployees(params),
    getDepartments(),
    getManagers(),
    getUniqueLocations(),
    getLegalEntities(),
    getStats(),
  ]);

  // Calculate pagination range
  const getPageRange = () => {
    const current = pagination.page;
    const total = pagination.totalPages;
    const delta = 2;
    const range: (number | string)[] = [];
    
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats - Premium style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Employee Directory</h1>
            <p className="text-white/70 mt-1">
              Browse and manage your organization's workforce
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/70" />
                <span className="text-lg font-bold">{stats.total}</span>
              </div>
              <p className="text-xs text-white/60">Total</p>
            </div>
            <div className="rounded-xl bg-emerald-500/20 backdrop-blur-sm px-4 py-2 border border-emerald-400/20">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-300" />
                <span className="text-lg font-bold">{stats.active}</span>
              </div>
              <p className="text-xs text-emerald-200/60">Active</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-white/70" />
                <span className="text-lg font-bold">{stats.departments}</span>
              </div>
              <p className="text-xs text-white/60">Depts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <QuickFilters currentStatus={params.status} counts={stats.counts} />
      </div>

      {/* Search & Advanced Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1">
          <DirectorySearch defaultValue={params.q} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SavedViewsSelector currentUserId={session.user.id} />
          {canBulkEdit && (
            <ExportButton searchParams={params} />
          )}
        </div>
      </div>

      {/* Advanced Filters Panel (collapsible) */}
      <AdvancedFiltersToggle 
        hasActiveFilters={!!(params.department || params.manager || params.location || params.legalEntity)}
      >
        <DirectoryFilters 
          departments={departments} 
          managers={managers}
          locations={locations}
          legalEntities={legalEntities}
          defaultDepartment={params.department}
          defaultStatus={params.status}
          defaultManager={params.manager}
          defaultLocation={params.location}
          defaultLegalEntity={params.legalEntity}
        />
      </AdvancedFiltersToggle>

      {/* Results info */}
      {(params.q || params.department || params.status || params.manager || params.location || params.legalEntity) && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Search className="h-4 w-4" />
          <span>
            Found <strong className="text-slate-900 dark:text-white">{pagination.total}</strong> employees
            {params.q && <span> matching "<strong className="text-indigo-600 dark:text-indigo-400">{params.q}</strong>"</span>}
          </span>
        </div>
      )}

      {/* Employee Grid with Bulk Actions */}
      {employees.length > 0 ? (
        <BulkActionsDirectory
          employees={employees.map((employee: any) => ({
            id: employee.id,
            fullName: employee.fullName,
            email: employee.email,
            avatarUrl: employee.avatarUrl,
            status: employee.status,
            department: employee.departmentId ? { id: employee.departmentId, name: employee.departmentName || "" } : null,
            position: employee.positionId ? { id: employee.positionId, title: employee.positionTitle || "" } : null,
            manager: employee.managerId ? { id: employee.managerId, fullName: employee.managerName || "", avatarUrl: employee.managerAvatarUrl } : null,
            // Extended fields for expandable card
            isManager: employee.isManager || false,
            location: employee.location,
            birthDate: employee.birthDate,
            startDate: employee.startDate,
            mattermostUsername: employee.mattermostUsername,
            telegramHandle: employee.telegramHandle,
            emergencyContactName: employee.emergencyContactName,
            emergencyContactPhone: employee.emergencyContactPhone,
            emergencyContactEmail: employee.emergencyContactEmail,
          }))}
          departments={departments}
          legalEntities={legalEntities}
          canBulkEdit={canBulkEdit}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No employees found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            Try adjusting your search query or filters to find what you're looking for
          </p>
        </div>
      )}

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          {/* Previous button */}
          <a
            href={pagination.page > 1 ? `/directory?page=${pagination.page - 1}${params.q ? `&q=${params.q}` : ""}${params.department ? `&department=${params.department}` : ""}${params.status ? `&status=${params.status}` : ""}${params.manager ? `&manager=${params.manager}` : ""}${params.location ? `&location=${params.location}` : ""}${params.legalEntity ? `&legalEntity=${params.legalEntity}` : ""}` : "#"}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all ${
              pagination.page === 1
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </a>
          
          {/* Page numbers */}
          {getPageRange().map((pageNum, idx) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
            ) : (
              <a
                key={pageNum}
                href={`/directory?page=${pageNum}${params.q ? `&q=${params.q}` : ""}${params.department ? `&department=${params.department}` : ""}${params.status ? `&status=${params.status}` : ""}${params.manager ? `&manager=${params.manager}` : ""}${params.location ? `&location=${params.location}` : ""}${params.legalEntity ? `&legalEntity=${params.legalEntity}` : ""}`}
                className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  pageNum === pagination.page
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {pageNum}
              </a>
            )
          ))}
          
          {/* Next button */}
          <a
            href={pagination.page < pagination.totalPages ? `/directory?page=${pagination.page + 1}${params.q ? `&q=${params.q}` : ""}${params.department ? `&department=${params.department}` : ""}${params.status ? `&status=${params.status}` : ""}${params.manager ? `&manager=${params.manager}` : ""}${params.location ? `&location=${params.location}` : ""}${params.legalEntity ? `&legalEntity=${params.legalEntity}` : ""}` : "#"}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all ${
              pagination.page === pagination.totalPages
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </a>
        </div>
      )}
    </div>
  );
}
