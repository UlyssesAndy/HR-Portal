import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Mail, Building2, Briefcase } from "lucide-react";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  manager: { id: string; fullName: string; avatarUrl: string | null } | null;
}

interface EmployeeCardProps {
  employee: Employee;
}

const statusColors: Record<string, "success" | "warning" | "secondary" | "default"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  MATERNITY: "warning",
  PENDING: "secondary",
};

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Link href={`/profile/${employee.id}`}>
      <Card className="group cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 hover:-translate-y-1 dark:hover:border-indigo-500/30 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-6">
              <UserAvatar
                name={employee.fullName}
                imageUrl={employee.avatarUrl}
                className="h-20 w-20 text-xl ring-4 ring-slate-100 dark:ring-slate-800 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900/50 transition-all"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Badge variant={statusColors[employee.status] || "default"} className="text-xs px-2 shadow-sm">
                  {employee.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {/* Name */}
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {employee.fullName}
            </h3>

            {/* Position */}
            {employee.position && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>{employee.position.title}</span>
              </div>
            )}

            {/* Department */}
            {employee.department && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Building2 className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                <span>{employee.department.name}</span>
              </div>
            )}

            {/* Email */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-3">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{employee.email}</span>
            </div>

            {/* Manager */}
            {employee.manager && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full">
                <UserAvatar
                  name={employee.manager.fullName}
                  imageUrl={employee.manager.avatarUrl}
                  className="h-6 w-6 text-xs"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Reports to {employee.manager.fullName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
