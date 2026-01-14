import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, User } from "lucide-react";

interface EmployeeHistoryProps {
  employeeId: string;
  canEdit?: boolean;
}

const fieldLabels: Record<string, string> = {
  fullName: "Name",
  email: "Email",
  phone: "Phone",
  location: "Location",
  timezone: "Timezone",
  status: "Status",
  departmentId: "Department",
  positionId: "Position",
  managerId: "Manager",
  startDate: "Start Date",
  birthDate: "Birth Date",
  employmentType: "Employment Type",
  legalEntity: "Legal Entity",
  statusNote: "Status Note",
  statusStartDate: "Status Start",
  statusEndDate: "Status End",
};

const sourceLabels: Record<string, string> = {
  GOOGLE_SYNC: "Google Sync",
  CSV_IMPORT: "CSV Import",
  MANUAL: "Manual Edit",
  JIRA: "Jira",
  SYSTEM: "System",
};

const sourceColors: Record<string, string> = {
  GOOGLE_SYNC: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  CSV_IMPORT: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  MANUAL: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  JIRA: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  SYSTEM: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
};

export async function EmployeeHistory({ employeeId, canEdit }: EmployeeHistoryProps) {
  const history = await db.employeeHistory.findMany({
    where: { employeeId },
    include: {
      changedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { changedAt: "desc" },
    take: 50,
  });

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-slate-400" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-8">
            No changes recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group history by date
  const groupedHistory = history.reduce((acc, item) => {
    const date = new Date(item.changedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof history>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-indigo-500" />
          Change History
          <span className="ml-auto text-sm font-normal text-slate-400">
            {history.length} changes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date}>
            <h4 className="text-sm font-semibold text-slate-500 mb-3">{date}</h4>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <History className="h-4 w-4 text-indigo-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">
                        {fieldLabels[item.fieldName] || item.fieldName}
                      </span>
                      <Badge className={sourceColors[item.changeSource] || "bg-slate-100 text-slate-700"}>
                        {sourceLabels[item.changeSource] || item.changeSource}
                      </Badge>
                      {item.isCorrection && (
                        <Badge variant="warning">Correction</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <span className="text-slate-500 line-through">
                        {item.oldValue || "(empty)"}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-900 font-medium">
                        {item.newValue || "(empty)"}
                      </span>
                    </div>
                    
                    {item.changeNote && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Note: {item.changeNote}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <User className="h-3 w-3" />
                      <span>
                        {item.changedBy?.fullName || "System"} at{" "}
                        {new Date(item.changedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
