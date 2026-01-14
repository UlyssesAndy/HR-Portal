// HR Portal - Type Definitions

import type { AppRole } from "@/lib/auth";

// ===========================================
// API Types
// ===========================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  departmentId?: string;
  status?: string;
  location?: string;
  managerId?: string;
}

// ===========================================
// Employee Types
// ===========================================

export interface EmployeeListItem {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  manager: { id: string; fullName: string } | null;
  location: string | null;
  timezone: string | null;
  status: EmployeeStatus;
}

export interface EmployeeProfile extends EmployeeListItem {
  firstName: string | null;
  lastName: string | null;
  startDate: string | null;
  birthDate: string | null;
  phone: string | null;
  messengerHandle: string | null;
  employmentType: EmploymentType | null;
  legalEntity: string | null;
  isExternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeStatus = 
  | "ACTIVE" 
  | "ON_LEAVE" 
  | "MATERNITY" 
  | "TERMINATED" 
  | "PENDING";

export type EmploymentType = 
  | "FULL_TIME" 
  | "PART_TIME" 
  | "CONTRACTOR" 
  | "INTERN";

// ===========================================
// Department & Position Types
// ===========================================

export interface Department {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  parent?: Department | null;
  isActive: boolean;
  employeeCount?: number;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string | null;
  department?: Department | null;
  isActive: boolean;
  employeeCount?: number;
}

// ===========================================
// Service Catalog Types
// ===========================================

export interface ServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  iconUrl: string | null;
  category: ServiceCategory | null;
  sortOrder: number;
  isActive: boolean;
  visibleToRoles: AppRole[];
}

// ===========================================
// Sync Types
// ===========================================

export interface SyncRun {
  id: string;
  trigger: "SCHEDULED" | "MANUAL" | "WEBHOOK";
  triggeredBy: { id: string; fullName: string } | null;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: string | null;
  completedAt: string | null;
  usersProcessed: number;
  usersCreated: number;
  usersUpdated: number;
  usersDeactivated: number;
  errorsCount: number;
  notes: string | null;
}

export interface SyncError {
  id: string;
  syncRunId: string;
  employeeId: string | null;
  googleUserEmail: string | null;
  errorType: string;
  errorMessage: string;
  errorDetails: Record<string, unknown> | null;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
  createdAt: string;
}

// ===========================================
// Invitation & Pending Access Types
// ===========================================

export interface Invitation {
  id: string;
  email: string;
  fullName: string | null;
  invitedBy: { id: string; fullName: string; email: string };
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface PendingAccess {
  id: string;
  email: string;
  fullName: string | null;
  source: "GOOGLE_SYNC" | "CSV_IMPORT" | "MANUAL" | "JIRA" | "SYSTEM";
  sourceReference: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  reviewedBy: { id: string; fullName: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

// ===========================================
// Audit Types
// ===========================================

export interface AuditEvent {
  id: string;
  actor: { id: string; email: string; fullName: string } | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ===========================================
// History Types
// ===========================================

export interface EmployeeHistoryEntry {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: { id: string; fullName: string } | null;
  changeSource: "GOOGLE_SYNC" | "CSV_IMPORT" | "MANUAL" | "JIRA" | "SYSTEM";
  changeNote: string | null;
  isCorrection: boolean;
}

// ===========================================
// CSV Import Types
// ===========================================

export interface CsvImport {
  id: string;
  filename: string;
  uploadedBy: { id: string; fullName: string };
  status: "uploaded" | "validated" | "committed" | "failed";
  dryRunAt: string | null;
  dryRunValidRows: number | null;
  dryRunErrorRows: number | null;
  dryRunErrors: Array<{ row: number; field: string; error: string }> | null;
  committedAt: string | null;
  rowsImported: number | null;
  rowsUpdated: number | null;
  rowsSkipped: number | null;
  createdAt: string;
}

// ===========================================
// Problem Record Types
// ===========================================

export interface ProblemRecord {
  id: string;
  employee: { id: string; fullName: string; email: string } | null;
  problemType: string;
  description: string;
  details: Record<string, unknown> | null;
  source: "GOOGLE_SYNC" | "CSV_IMPORT" | "MANUAL" | "JIRA" | "SYSTEM";
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
  resolutionNote: string | null;
  createdAt: string;
}

// ===========================================
// User & Session Types
// ===========================================

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: AppRole[];
}

export function hasRole(user: CurrentUser | null, role: AppRole): boolean {
  return user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(user: CurrentUser | null, roles: AppRole[]): boolean {
  return roles.some(role => hasRole(user, role));
}

export function isAdmin(user: CurrentUser | null): boolean {
  return hasRole(user, "ADMIN");
}

export function isHR(user: CurrentUser | null): boolean {
  return hasAnyRole(user, ["HR", "ADMIN"]);
}

export function isManager(user: CurrentUser | null): boolean {
  return hasAnyRole(user, ["MANAGER", "HR", "ADMIN"]);
}
