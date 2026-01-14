"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, X } from "lucide-react";
import { useTransition } from "react";

interface Department {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  fullName: string;
}

interface LegalEntity {
  id: string;
  name: string;
  shortName: string | null;
}

interface DirectoryFiltersProps {
  departments: Department[];
  managers: Manager[];
  locations: string[];
  legalEntities: LegalEntity[];
  defaultDepartment?: string;
  defaultStatus?: string;
  defaultManager?: string;
  defaultLocation?: string;
  defaultLegalEntity?: string;
}

const statuses = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PENDING", label: "Pending" },
];

export function DirectoryFilters({
  departments,
  managers,
  locations,
  legalEntities,
  defaultDepartment = "",
  defaultStatus = "",
  defaultManager = "",
  defaultLocation = "",
  defaultLegalEntity = "",
}: DirectoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`/directory?${params.toString()}`);
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("department");
    params.delete("status");
    params.delete("manager");
    params.delete("location");
    params.delete("legalEntity");
    params.set("page", "1");
    startTransition(() => {
      router.push(`/directory?${params.toString()}`);
    });
  };

  const hasFilters = defaultDepartment || defaultStatus || defaultManager || defaultLocation || defaultLegalEntity;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Filter className="h-5 w-5 text-slate-400" />
      
      {/* Department Filter */}
      <div className="relative">
        <select
          value={defaultDepartment}
          onChange={(e) => handleFilter("department", e.target.value)}
          className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={defaultStatus}
          onChange={(e) => handleFilter("status", e.target.value)}
          className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Manager Filter */}
      {managers.length > 0 && (
        <div className="relative">
          <select
            value={defaultManager}
            onChange={(e) => handleFilter("manager", e.target.value)}
            className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="">All Managers</option>
            {managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.fullName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      )}

      {/* Location Filter */}
      {locations.length > 0 && (
        <div className="relative">
          <select
            value={defaultLocation}
            onChange={(e) => handleFilter("location", e.target.value)}
            className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      )}

      {/* Legal Entity Filter */}
      {legalEntities.length > 0 && (
        <div className="relative">
          <select
            value={defaultLegalEntity}
            onChange={(e) => handleFilter("legalEntity", e.target.value)}
            className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="">All Legal Entities</option>
            {legalEntities.map((le) => (
              <option key={le.id} value={le.id}>
                {le.shortName || le.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      )}

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearAllFilters}
          className="h-10 px-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}

      {isPending && (
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}
