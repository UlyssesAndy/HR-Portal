import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { fuzzySearchEmployees, getUniqueLocations, getManagers } from "@/lib/search";
import { DirectorySearch } from "@/components/directory/directory-search";
import { DirectoryFilters } from "@/components/directory/directory-filters";
import { ExportButton } from "@/components/directory/export-button";
import { BulkActionsDirectory } from "@/components/directory/bulk-actions-directory";
import { Users } from "lucide-react";

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

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canBulkEdit = session.user.roles?.includes("HR") || session.user.roles?.includes("ADMIN");

  const params = await searchParams;
  const [{ employees, pagination }, departments, managers, locations, legalEntities] = await Promise.all([
    getEmployees(params),
    getDepartments(),
    getManagers(),
    getUniqueLocations(),
    getLegalEntities(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header - Premium style */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            Employee Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {pagination.total} employees found
            {params.q && <span className="text-indigo-600 dark:text-indigo-400 font-medium"> for "{params.q}"</span>}
          </p>
        </div>
        {canBulkEdit && (
          <ExportButton searchParams={params} />
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <DirectorySearch defaultValue={params.q} />
        </div>
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
      </div>

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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No employees found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((pageNum) => (
            <a
              key={pageNum}
              href={`/directory?page=${pageNum}${params.q ? `&q=${params.q}` : ""}${params.department ? `&department=${params.department}` : ""}${params.status ? `&status=${params.status}` : ""}${params.manager ? `&manager=${params.manager}` : ""}${params.location ? `&location=${params.location}` : ""}${params.legalEntity ? `&legalEntity=${params.legalEntity}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pageNum === pagination.page
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
