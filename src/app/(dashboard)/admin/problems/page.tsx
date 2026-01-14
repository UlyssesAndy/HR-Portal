import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, CheckCircle, Clock, User, 
  RefreshCw, FileText, XCircle, ChevronRight
} from "lucide-react";

async function getProblemRecords() {
  const [unresolved, resolved, recentlyResolved] = await Promise.all([
    db.problemRecord.findMany({
      where: { isResolved: false },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.problemRecord.count({ where: { isResolved: true } }),
    db.problemRecord.findMany({
      where: { isResolved: true },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { resolvedAt: "desc" },
      take: 10,
    }),
  ]);

  return { unresolved, resolvedCount: resolved, recentlyResolved };
}

const problemTypeIcons: Record<string, React.ReactNode> = {
  "DUPLICATE_EMAIL": <User className="h-4 w-4" />,
  "MISSING_MANAGER": <User className="h-4 w-4" />,
  "INVALID_DEPARTMENT": <FileText className="h-4 w-4" />,
  "SYNC_CONFLICT": <RefreshCw className="h-4 w-4" />,
  "DATA_MISMATCH": <AlertTriangle className="h-4 w-4" />,
  "default": <AlertTriangle className="h-4 w-4" />,
};

const problemTypeColors: Record<string, string> = {
  "DUPLICATE_EMAIL": "bg-red-100 text-red-700",
  "MISSING_MANAGER": "bg-amber-100 text-amber-700",
  "INVALID_DEPARTMENT": "bg-orange-100 text-orange-700",
  "SYNC_CONFLICT": "bg-purple-100 text-purple-700",
  "DATA_MISMATCH": "bg-blue-100 text-blue-700",
  "default": "bg-slate-100 text-slate-700",
};

const sourceLabels: Record<string, string> = {
  "GOOGLE_SYNC": "Google Sync",
  "CSV_IMPORT": "CSV Import",
  "MANUAL": "Manual Entry",
  "JIRA": "Jira Integration",
  "SYSTEM": "System",
};

export default async function ProblemsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { unresolved, resolvedCount, recentlyResolved } = await getProblemRecords();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Problem Queue
        </h1>
        <p className="text-slate-500 mt-1">
          Review and resolve data issues
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={unresolved.length > 0 ? "border-amber-200 bg-amber-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                unresolved.length > 0 ? "bg-amber-100" : "bg-slate-100"
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  unresolved.length > 0 ? "text-amber-600" : "text-slate-600"
                }`} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Issues</p>
                <p className="text-2xl font-bold text-slate-900">{unresolved.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Resolved</p>
                <p className="text-2xl font-bold text-slate-900">{resolvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Resolution Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {unresolved.length + resolvedCount > 0 
                    ? Math.round((resolvedCount / (unresolved.length + resolvedCount)) * 100)
                    : 100}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pending Issues
            {unresolved.length > 0 && (
              <Badge variant="warning" className="ml-2">
                {unresolved.length} requires attention
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {unresolved.map((problem) => (
              <div
                key={problem.id}
                className="flex items-start gap-4 py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors group cursor-pointer"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  problemTypeColors[problem.problemType] || problemTypeColors.default
                }`}>
                  {problemTypeIcons[problem.problemType] || problemTypeIcons.default}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {problem.problemType.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="secondary">
                      {sourceLabels[problem.source] || problem.source}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-700 mt-2">{problem.description}</p>
                  
                  {problem.employee && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      {problem.employee.fullName} ({problem.employee.email})
                    </div>
                  )}
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-slate-400">
                    {new Date(problem.createdAt).toLocaleDateString()}
                  </div>
                  <button className="mt-2 px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
            
            {unresolved.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">All clear!</h3>
                <p className="text-slate-500">No pending issues to resolve</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recently Resolved */}
      {recentlyResolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recently Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {recentlyResolved.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="font-medium text-slate-900">
                        {problem.problemType.replace(/_/g, " ")}
                      </span>
                      {problem.employee && (
                        <span className="text-slate-500 ml-2">
                          - {problem.employee.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div>Resolved by {problem.resolvedBy?.fullName || "System"}</div>
                    <div className="text-xs text-slate-400">
                      {problem.resolvedAt && new Date(problem.resolvedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
