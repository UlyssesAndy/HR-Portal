import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

interface ActivityFeedDynamicProps {
  limit?: number;
  showAvatar?: boolean;
}

async function getActivityData(limit: number) {
  const activities = await db.auditEvent.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      actorEmail: true,
      createdAt: true,
      resourceType: true,
    },
  });

  return activities;
}

export async function ActivityFeedDynamic({ limit = 10, showAvatar = true }: ActivityFeedDynamicProps) {
  const activities = await getActivityData(limit);

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                {showAvatar && (
                  <UserAvatar
                    imageUrl={null}
                    name={activity.actorEmail || "Unknown"}
                    size="sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {activity.actorEmail}
                  </p>
                  <p className="text-sm text-slate-600">
                    {activity.action} - {activity.resourceType}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
