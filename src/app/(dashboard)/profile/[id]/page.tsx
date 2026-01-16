import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditButton } from "@/components/profile/profile-edit-button";
import { ProfileSelfEdit } from "@/components/profile/profile-self-edit";
import { EmployeeHistoryClient } from "@/components/profile/employee-history-client";
import { QuickActions } from "@/components/profile/quick-actions";
import { PhotoUpload } from "@/components/profile/photo-upload";
import Link from "next/link";
import { 
  Mail, Phone, MapPin, Calendar, Building2, Briefcase, 
  Users, Clock, Globe, MessageSquare, ChevronLeft,
  UserCircle, BadgeCheck, Shield, AlertCircle
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEmployee(id: string) {
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: true,
      position: true,
      legalEntity: true,
      manager: {
        select: { id: true, fullName: true, avatarUrl: true, position: true },
      },
      directReports: {
        where: { status: { not: "TERMINATED" } },
        include: {
          position: true,
        },
        orderBy: { fullName: "asc" },
      },
      roleAssignments: {
        select: { role: true },
      },
    },
  });

  return employee;
}

async function getEditData() {
  const [departments, positions, managers, legalEntities] = await Promise.all([
    db.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.position.findMany({ where: { isActive: true }, orderBy: { title: "asc" } }),
    db.employee.findMany({
      where: { status: { not: "TERMINATED" } },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    db.legalEntity.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { departments, positions, managers, legalEntities };
}

async function getEmployeeHistory(employeeId: string) {
  const history = await db.employeeHistory.findMany({
    where: { employeeId },
    include: {
      changedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { changedAt: "desc" },
    take: 50,
  });

  // Resolve IDs to names for better display
  const enrichedHistory = await Promise.all(
    history.map(async (item) => {
      let displayOldValue = item.oldValue;
      let displayNewValue = item.newValue;

      // Resolve department names
      if (item.fieldName === "departmentId") {
        if (item.oldValue) {
          const oldDept = await db.department.findUnique({
            where: { id: item.oldValue },
            select: { name: true },
          });
          displayOldValue = oldDept?.name || item.oldValue;
        }
        if (item.newValue) {
          const newDept = await db.department.findUnique({
            where: { id: item.newValue },
            select: { name: true },
          });
          displayNewValue = newDept?.name || item.newValue;
        }
      }

      // Resolve position names
      if (item.fieldName === "positionId") {
        if (item.oldValue) {
          const oldPos = await db.position.findUnique({
            where: { id: item.oldValue },
            select: { title: true },
          });
          displayOldValue = oldPos?.title || item.oldValue;
        }
        if (item.newValue) {
          const newPos = await db.position.findUnique({
            where: { id: item.newValue },
            select: { title: true },
          });
          displayNewValue = newPos?.title || item.newValue;
        }
      }

      // Resolve manager names
      if (item.fieldName === "managerId") {
        if (item.oldValue) {
          const oldMgr = await db.employee.findUnique({
            where: { id: item.oldValue },
            select: { fullName: true },
          });
          displayOldValue = oldMgr?.fullName || item.oldValue;
        }
        if (item.newValue) {
          const newMgr = await db.employee.findUnique({
            where: { id: item.newValue },
            select: { fullName: true },
          });
          displayNewValue = newMgr?.fullName || item.newValue;
        }
      }

      // Resolve legal entity names
      if (item.fieldName === "legalEntityId") {
        if (item.oldValue) {
          const oldLE = await db.legalEntity.findUnique({
            where: { id: item.oldValue },
            select: { name: true, shortName: true },
          });
          displayOldValue = oldLE?.shortName || oldLE?.name || item.oldValue;
        }
        if (item.newValue) {
          const newLE = await db.legalEntity.findUnique({
            where: { id: item.newValue },
            select: { name: true, shortName: true },
          });
          displayNewValue = newLE?.shortName || newLE?.name || item.newValue;
        }
      }

      return {
        ...item,
        oldValue: displayOldValue,
        newValue: displayNewValue,
      };
    })
  );

  return enrichedHistory;
}

const statusColors: Record<string, "success" | "warning" | "secondary" | "default"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  MATERNITY: "warning",
  PENDING: "secondary",
  TERMINATED: "default",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  MATERNITY: "Maternity Leave",
  PENDING: "Pending",
  TERMINATED: "Terminated",
};

const roleLabels: Record<string, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HR: "HR",
  PAYROLL_FINANCE: "Payroll & Finance",
  ADMIN: "Administrator",
};

const roleColors: Record<string, string> = {
  EMPLOYEE: "bg-slate-100 text-slate-700",
  MANAGER: "bg-blue-100 text-blue-700",
  HR: "bg-purple-100 text-purple-700",
  PAYROLL_FINANCE: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default async function ProfilePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const isOwnProfile = session.user.id === employee.id;
  const isHR = session.user.roles?.includes("HR") || session.user.roles?.includes("ADMIN");
  const canSeeRestrictedFields = isOwnProfile || isHR;

  // Fetch edit data only if HR can edit
  const editData = isHR ? await getEditData() : null;
  const history = isHR ? await getEmployeeHistory(employee.id) : [];

  const roles = employee.roleAssignments.map(r => r.role);

  return (
    <div className="space-y-8">
      {/* Back Button + Edit */}
      <div className="flex items-center justify-between">
        <Link 
          href="/directory" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Directory
        </Link>
        
        {isHR && editData && (
          <div className="flex items-center gap-2">
            <QuickActions
              employeeId={employee.id}
              employeeName={employee.fullName}
              currentStatus={employee.status}
              canEdit={true}
              departments={editData.departments}
              legalEntities={editData.legalEntities}
              managers={editData.managers}
            />
            <ProfileEditButton
              employee={employee}
              departments={editData.departments}
              positions={editData.positions}
              managers={editData.managers}
              legalEntities={editData.legalEntities}
            />
          </div>
        )}
        {isOwnProfile && !isHR && (
          <ProfileSelfEdit
            employee={{
              id: employee.id,
              phone: employee.phone,
              timezone: employee.timezone,
            }}
          />
        )}
      </div>

      {/* Profile Header - Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {isOwnProfile ? (
            <PhotoUpload
              employeeId={employee.id}
              currentPhotoUrl={employee.avatarUrl}
              employeeName={employee.fullName}
              size="lg"
            />
          ) : (
            <UserAvatar
              name={employee.fullName}
              imageUrl={employee.avatarUrl}
              className="h-32 w-32 text-4xl ring-4 ring-white/30 shadow-2xl"
            />
          )}
          
          <div className="text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold">{employee.fullName}</h1>
              <Badge variant={statusColors[employee.status]} className="text-sm">
                {statusLabels[employee.status]}
              </Badge>
            </div>
            
            {employee.position && (
              <p className="text-xl text-white/90">{employee.position.title}</p>
            )}
            
            {employee.department && (
              <p className="text-white/70 mt-1">{employee.department.name}</p>
            )}

            {/* Roles */}
            <div className="flex flex-wrap gap-2 mt-4">
              {roles.map((role) => (
                <span 
                  key={role} 
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${roleColors[role]}`}
                >
                  <Shield className="h-3 w-3" />
                  {roleLabels[role]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Manager */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCircle className="h-5 w-5 text-blue-500" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              
              {employee.phone && canSeeRestrictedFields && (
                <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              )}
              
              {employee.mattermostUsername && (
                <InfoRow icon={MessageSquare} label="Mattermost" value={`@${employee.mattermostUsername}`} />
              )}
              
              {employee.telegramHandle && (
                <InfoRow icon={MessageSquare} label="Telegram" value={`@${employee.telegramHandle}`} />
              )}
              
              {employee.messengerHandle && (
                <InfoRow icon={MessageSquare} label="Messenger" value={employee.messengerHandle} />
              )}
              
              {employee.location && (
                <InfoRow icon={MapPin} label="Location" value={employee.location} />
              )}
              
              {employee.timezone && (
                <InfoRow icon={Globe} label="Timezone" value={employee.timezone} />
              )}
            </CardContent>
          </Card>

          {/* Manager */}
          {employee.manager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BadgeCheck className="h-5 w-5 text-green-500" />
                  Reports To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/profile/${employee.manager.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors group"
                >
                  <UserAvatar
                    name={employee.manager.fullName}
                    imageUrl={employee.manager.avatarUrl}
                    className="h-12 w-12 ring-2 ring-white shadow"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {employee.manager.fullName}
                    </p>
                    {employee.manager.position && (
                      <p className="text-sm text-slate-500">
                        {employee.manager.position.title}
                      </p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Column - Work Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                Work Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.department && (
                <InfoRow icon={Building2} label="Department" value={employee.department.name} />
              )}
              
              {employee.position && (
                <InfoRow icon={Briefcase} label="Position" value={employee.position.title} />
              )}
              
              {employee.startDate && (
                <InfoRow 
                  icon={Calendar} 
                  label="Start Date" 
                  value={new Date(employee.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })} 
                />
              )}
              
              {canSeeRestrictedFields && employee.employmentType && (
                <InfoRow 
                  icon={Clock} 
                  label="Employment Type" 
                  value={employee.employmentType.replace("_", " ")} 
                />
              )}
              
              {canSeeRestrictedFields && employee.legalEntity && (
                <InfoRow icon={Building2} label="Legal Entity" value={employee.legalEntity.shortName || employee.legalEntity.name} />
              )}
            </CardContent>
          </Card>

          {/* Status Info (if on leave) */}
          {employee.status !== "ACTIVE" && employee.statusNote && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
                  <Clock className="h-5 w-5" />
                  Status Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-amber-800">
                {employee.statusStartDate && (
                  <p className="text-sm">
                    <span className="font-medium">From:</span>{" "}
                    {new Date(employee.statusStartDate).toLocaleDateString()}
                  </p>
                )}
                {employee.statusEndDate && (
                  <p className="text-sm">
                    <span className="font-medium">Until:</span>{" "}
                    {new Date(employee.statusEndDate).toLocaleDateString()}
                  </p>
                )}
                {employee.statusNote && (
                  <p className="text-sm">{employee.statusNote}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Direct Reports */}
        <div className="space-y-6">
          {employee.directReports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-purple-500" />
                  Direct Reports
                  <span className="ml-auto text-sm font-normal text-slate-500">
                    {employee.directReports.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {employee.directReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/profile/${report.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <UserAvatar
                      name={report.fullName}
                      imageUrl={report.avatarUrl}
                      className="h-10 w-10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {report.fullName}
                      </p>
                      {report.position && (
                        <p className="text-xs text-slate-500 truncate">
                          {report.position.title}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Birthday (if visible) */}
          {canSeeRestrictedFields && employee.birthDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-pink-500" />
                  Birthday
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">
                  {new Date(employee.birthDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact (if visible and has data) */}
          {canSeeRestrictedFields && (employee.emergencyContactName || employee.emergencyContactPhone || employee.emergencyContactEmail) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {employee.emergencyContactName && (
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Name:</span> {employee.emergencyContactName}
                  </p>
                )}
                {employee.emergencyContactPhone && (
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Phone:</span> {employee.emergencyContactPhone}
                  </p>
                )}
                {employee.emergencyContactEmail && (
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Email:</span> {employee.emergencyContactEmail}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Change History (HR/Admin only) */}
      {isHR && editData && (
        <EmployeeHistoryClient
          employeeId={employee.id}
          employeeName={employee.fullName}
          history={history}
          canEdit={isHR}
          departments={editData.departments}
          positions={editData.positions.map(p => ({ id: p.id, title: p.title }))}
          managers={editData.managers}
        />
      )}
    </div>
  );
}

function InfoRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
