import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            Google Sync
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor and manage Google Directory synchronization
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Syncs</p>
                <p className="text-2xl font-bold text-slate-900">{recentSyncs.length}</p>
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
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Errors</p>
                <p className="text-2xl font-bold text-slate-900">{pendingErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Last Sync</p>
                <p className="text-lg font-bold text-slate-900">
                  {recentSyncs[0]?.startedAt 
                    ? new Date(recentSyncs[0].startedAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentSyncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    {statusIcons[sync.status]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[sync.status]}>
                        {sync.status}
                      </Badge>
                      <Badge variant="secondary">{sync.trigger}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
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
                      <p className="text-slate-500">Processed</p>
                      <p className="font-semibold text-slate-900">{sync.usersProcessed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Created</p>
                      <p className="font-semibold text-green-600">{sync.usersCreated}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Updated</p>
                      <p className="font-semibold text-blue-600">{sync.usersUpdated}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500">Errors</p>
                      <p className={`font-semibold ${sync._count.errors > 0 ? "text-red-600" : "text-slate-900"}`}>
                        {sync._count.errors}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {recentSyncs.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No sync runs yet. Click "Run Sync Now" to start your first sync!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
