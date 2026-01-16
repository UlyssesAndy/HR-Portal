import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, CheckCircle, Clock, User, 
  RefreshCw, FileText, XCircle, ChevronRight, AlertOctagon, TrendingUp
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
  "DUPLICATE_EMAIL": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "MISSING_MANAGER": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "INVALID_DEPARTMENT": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "SYNC_CONFLICT": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "DATA_MISMATCH": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "default": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
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
  const resolutionRate = unresolved.length + resolvedCount > 0 
    ? Math.round((resolvedCount / (unresolved.length + resolvedCount)) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
        unresolved.length > 0 
          ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-orange-500/20"
          : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20"
      }`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {unresolved.length > 0 ? <AlertOctagon className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            </div>
            <h1 className="text-2xl font-bold">Problem Queue</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            {unresolved.length > 0 
              ? `${unresolved.length} issue${unresolved.length > 1 ? 's' : ''} require your attention`
              : "All issues resolved - great work!"}
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">{unresolved.length}</span>
              <span className="text-white/80 text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{resolvedCount}</span>
              <span className="text-white/80 text-sm">Resolved</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{resolutionRate}%</span>
              <span className="text-white/80 text-sm">Resolution Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Issues */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {unresolved.map((problem) => (
              <div
                key={problem.id}
                className="flex items-start gap-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-6 px-6 transition-colors group cursor-pointer"
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
                  
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{problem.description}</p>
                  
                  {problem.employee && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <User className="h-3.5 w-3.5" />
                      {problem.employee.fullName} ({problem.employee.email})
                    </div>
                  )}
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-slate-400 dark:text-slate-500">
                    {new Date(problem.createdAt).toLocaleDateString()}
                  </div>
                  <button className="mt-2 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
            
            {unresolved.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All clear!</h3>
                <p className="text-slate-500 dark:text-slate-400">No pending issues to resolve</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recently Resolved */}
      {recentlyResolved.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recently Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentlyResolved.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {problem.problemType.replace(/_/g, " ")}
                      </span>
                      {problem.employee && (
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          - {problem.employee.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                    <div>Resolved by {problem.resolvedBy?.fullName || "System"}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
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
