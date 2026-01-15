import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

interface RecentEmployeesDynamicProps {
  limit?: number;
}

async function getRecentEmployees(limit: number) {
  const employees = await db.employee.findMany({
    take: limit,
    orderBy: { hireDate: "desc" },
    where: { status: { not: "TERMINATED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      status: true,
      position: {
        select: {
          title: true,
        },
      },
      hireDate: true,
    },
  });

  return employees;
}

export async function RecentEmployeesDynamic({ limit = 5 }: RecentEmployeesDynamicProps) {
  const employees = await getRecentEmployees(limit);

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Recent Employees
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {employees.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No employees found</p>
          ) : (
            employees.map((employee) => (
              <Link
                key={employee.id}
                href={`/directory/${employee.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <UserAvatar
                  src={employee.avatarUrl}
                  name={`${employee.firstName} ${employee.lastName}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {employee.position?.title || "No position"}
                  </p>
                </div>
                <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"}>
                  {employee.status}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
