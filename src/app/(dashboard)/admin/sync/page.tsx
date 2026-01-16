import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Cloud, Zap } from "lucide-react";
import { SyncButton } from "@/components/admin/sync-button";

async function getSyncData() {
  const [recentSyncs, stats] = await Promise.all([
    db.syncRun.findMany({
      include: {
        triggeredBy: { select: { id: true, fullName: true } },
        _count: { select: { errors: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    db.syncRun.aggregate({
      _count: { id: true },
      where: { status: "COMPLETED" },
    }),
  ]);
  
  const pendingErrors = await db.syncError.count({ where: { isResolved: false } });
  
  return { recentSyncs, totalCompleted: stats._count.id, pendingErrors };
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  RUNNING: <RefreshCw className="h-4 w-4 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
};

const statusColors: Record<string, "default" | "warning" | "success" | "secondary"> = {
  PENDING: "secondary",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "default",
};

export default async function SyncAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { recentSyncs, totalCompleted, pendingErrors } = await getSyncData();

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Cloud className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold">Google Sync</h1>
            </div>
            <SyncButton />
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Monitor and manage Google Directory synchronization
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-semibold">{recentSyncs.length}</span>
              <span className="text-white/80 text-sm">Total Syncs</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{totalCompleted}</span>
              <span className="text-white/80 text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">{pendingErrors}</span>
              <span className="text-white/80 text-sm">Errors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">
                {recentSyncs[0]?.startedAt 
                  ? new Date(recentSyncs[0].startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "Never"}
              </span>
              <span className="text-white/80 text-sm">Last Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync History */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Recent Sync Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentSyncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {statusIcons[sync.status]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[sync.status]}>
                        {sync.status}
                      </Badge>
                      <Badge variant="secondary">{sync.trigger}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {sync.startedAt && (
                        <span>Started: {new Date(sync.startedAt).toLocaleString()}</span>
                      )}
                      {sync.triggeredBy && (
                        <span>By: {sync.triggeredBy.fullName}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Processed</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{sync.usersProcessed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Created</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">{sync.usersCreated}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Updated</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{sync.usersUpdated}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">Errors</p>
                      <p className={`font-semibold ${sync._count.errors > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                        {sync._count.errors}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {recentSyncs.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No sync runs yet. Click "Run Sync Now" to start your first sync!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
