import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  ArrowUp, 
  ArrowRight, 
  ArrowDown, 
  Users, 
  Crown, 
  Briefcase,
  ChevronRight
} from "lucide-react";

interface TeamMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  position?: { title: string } | null;
  status: string;
}

interface TeamViewProps {
  manager: TeamMember | null;
  peers: TeamMember[];
  directReports: TeamMember[];
  currentEmployeeId: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ON_LEAVE: "bg-amber-500",
  MATERNITY: "bg-pink-500",
  PENDING: "bg-blue-500",
  TERMINATED: "bg-slate-400",
};

export function TeamView({ manager, peers, directReports, currentEmployeeId }: TeamViewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Team Structure</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organizational hierarchy
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Manager Section */}
        {manager && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Reports To</span>
            </div>
            <Link
              href={`/profile/${manager.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <div className="relative">
                <UserAvatar
                  name={manager.fullName}
                  imageUrl={manager.avatarUrl}
                  className="h-14 w-14 ring-3 ring-blue-500/20"
                />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {manager.fullName}
                </p>
                {manager.position && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {manager.position.title}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        )}

        {/* Peers Section */}
        {peers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Peers
              </span>
              <Badge variant="secondary" className="text-xs">
                {peers.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {peers.slice(0, 6).map((peer) => (
                <Link
                  key={peer.id}
                  href={`/profile/${peer.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                >
                  <div className="relative">
                    <UserAvatar
                      name={peer.fullName}
                      imageUrl={peer.avatarUrl}
                      className="h-10 w-10"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${statusColors[peer.status]} ring-2 ring-white dark:ring-slate-800`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      {peer.fullName}
                    </p>
                    {peer.position && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {peer.position.title}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {peers.length > 6 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                +{peers.length - 6} more peers
              </p>
            )}
          </div>
        )}

        {/* Direct Reports Section */}
        {directReports.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDown className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Direct Reports
              </span>
              <Badge variant="secondary" className="text-xs">
                {directReports.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {directReports.slice(0, 8).map((report) => (
                <Link
                  key={report.id}
                  href={`/profile/${report.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                >
                  <div className="relative">
                    <UserAvatar
                      name={report.fullName}
                      imageUrl={report.avatarUrl}
                      className="h-10 w-10"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ${statusColors[report.status]} ring-2 ring-white dark:ring-slate-800`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {report.fullName}
                    </p>
                    {report.position && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {report.position.title}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {directReports.length > 8 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                +{directReports.length - 8} more direct reports
              </p>
            )}
          </div>
        )}

        {/* No team data */}
        {!manager && peers.length === 0 && directReports.length === 0 && (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              No team structure available
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Manager and direct reports will appear here once assigned
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
