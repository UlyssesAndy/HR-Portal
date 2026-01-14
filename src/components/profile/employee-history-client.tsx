"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, User, Plus } from "lucide-react";
import { HistoryCorrectionForm } from "./history-correction-form";

interface HistoryItem {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date | string;
  changeSource: string;
  changeNote: string | null;
  isCorrection: boolean;
  changedBy: { id: string; fullName: string } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Manager {
  id: string;
  fullName: string;
}

interface EmployeeHistoryClientProps {
  employeeId: string;
  employeeName: string;
  history: HistoryItem[];
  canEdit?: boolean;
  departments?: Department[];
  positions?: Position[];
  managers?: Manager[];
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

export function EmployeeHistoryClient({
  employeeId,
  employeeName,
  history,
  canEdit,
  departments,
  positions,
  managers,
}: EmployeeHistoryClientProps) {
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-indigo-500" />
              Change History
              <span className="ml-2 text-sm font-normal text-slate-400">
                {history.length} changes
              </span>
            </CardTitle>
            {canEdit && (
              <button
                onClick={() => setShowCorrectionForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Correction
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No changes recorded yet
            </p>
          ) : (
            Object.entries(groupedHistory).map(([date, items]) => (
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
                          <Badge
                            className={
                              sourceColors[item.changeSource] ||
                              "bg-slate-100 text-slate-700"
                            }
                          >
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
            ))
          )}
        </CardContent>
      </Card>

      {showCorrectionForm && (
        <HistoryCorrectionForm
          employeeId={employeeId}
          employeeName={employeeName}
          departments={departments}
          positions={positions}
          managers={managers}
          onClose={() => setShowCorrectionForm(false)}
        />
      )}
    </>
  );
}
