import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Filter, User, Clock, 
  Shield, Database, LogIn, LogOut,
  Edit, Trash2, Eye, Activity
} from "lucide-react";

interface SearchParams {
  action?: string;
  resource?: string;
  page?: string;
}

async function getAuditLogs(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const perPage = 25;
  const skip = (page - 1) * perPage;

  const where: any = {};
  
  if (searchParams.action) {
    where.action = { contains: searchParams.action, mode: "insensitive" };
  }
  
  if (searchParams.resource) {
    where.resourceType = searchParams.resource;
  }

  const [events, total] = await Promise.all([
    db.auditEvent.findMany({
      where,
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    db.auditEvent.count({ where }),
  ]);

  return {
    events,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

const actionIcons: Record<string, React.ReactNode> = {
  "LOGIN": <LogIn className="h-4 w-4" />,
  "LOGOUT": <LogOut className="h-4 w-4" />,
  "CREATE": <Edit className="h-4 w-4" />,
  "UPDATE": <Edit className="h-4 w-4" />,
  "DELETE": <Trash2 className="h-4 w-4" />,
  "VIEW": <Eye className="h-4 w-4" />,
  "default": <FileText className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  "LOGIN": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "LOGOUT": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  "CREATE": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "UPDATE": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "DELETE": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "VIEW": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "default": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const params = await searchParams;
  const { events, pagination } = await getAuditLogs(params);

  // Get unique resource types for filter
  const resourceTypes = await db.auditEvent.groupBy({
    by: ["resourceType"],
    _count: true,
  });

  const uniqueActors = new Set(events.map(e => e.actorId)).size;

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-xl shadow-slate-900/30">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
          </div>
          <p className="text-white/70 mb-6 max-w-lg">
            Complete history of all system actions and changes
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Activity className="h-4 w-4" />
              <span className="font-semibold">{pagination.total}</span>
              <span className="text-white/70 text-sm">Events</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <User className="h-4 w-4" />
              <span className="font-semibold">{uniqueActors}</span>
              <span className="text-white/70 text-sm">Actors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Database className="h-4 w-4" />
              <span className="font-semibold">{resourceTypes.length}</span>
              <span className="text-white/70 text-sm">Resources</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">
                {events[0]?.createdAt 
                  ? new Date(events[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "N/A"}
              </span>
              <span className="text-white/70 text-sm">Last Event</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resourceTypes.map((rt) => (
                <a
                  key={rt.resourceType}
                  href={`/admin/audit?resource=${rt.resourceType}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    params.resource === rt.resourceType
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {rt.resourceType} ({rt._count})
                </a>
              ))}
              {params.resource && (
                <a
                  href="/admin/audit"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Clear
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event List */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5 text-slate-400" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-6 px-6 transition-colors"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${actionColors[event.action] || actionColors.default}`}>
                  {actionIcons[event.action] || actionIcons.default}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{event.action}</Badge>
                    <Badge variant="secondary">{event.resourceType}</Badge>
                    {event.resourceId && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {event.resourceId.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {event.actor?.fullName || event.actorEmail || "System"}
                    </span>
                    {event.actorIp && (
                      <span className="text-slate-400 dark:text-slate-500 ml-2">
                        from {event.actorIp}
                      </span>
                    )}
                  </div>
                  
                  {(event.oldValues || event.newValues) && (
                    <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 font-mono overflow-x-auto">
                      {event.oldValues && (
                        <div className="text-red-600 dark:text-red-400">- {JSON.stringify(event.oldValues)}</div>
                      )}
                      {event.newValues && (
                        <div className="text-green-600 dark:text-green-400">+ {JSON.stringify(event.newValues)}</div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right text-sm text-slate-400 dark:text-slate-500 flex-shrink-0">
                  <div>{new Date(event.createdAt).toLocaleDateString()}</div>
                  <div>{new Date(event.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No audit events found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((pageNum) => (
            <a
              key={pageNum}
              href={`/admin/audit?page=${pageNum}${params.resource ? `&resource=${params.resource}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pageNum === pagination.page
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
              }`}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
