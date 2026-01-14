"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { 
  Activity, LogIn, UserPlus, Edit, Shield, Upload, RefreshCw, 
  Building2, Briefcase, Users, Settings, Loader2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actor: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
  };
  metadata: Record<string, any> | null;
  timestamp: string;
  description: string;
}

const actionIcons: Record<string, typeof Activity> = {
  "auth.login": LogIn,
  "employee.create": UserPlus,
  "employee.update": Edit,
  "role.assign": Shield,
  "role.revoke": Shield,
  "csv.import": Upload,
  "sync.complete": RefreshCw,
  "department.create": Building2,
  "department.update": Building2,
  "position.create": Briefcase,
  "position.update": Briefcase,
  "BULK_UPDATE": Users,
  "UPDATE_CONFIG": Settings,
};

const actionColors: Record<string, string> = {
  "auth.login": "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  "employee.create": "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  "employee.update": "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  "role.assign": "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  "role.revoke": "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  "csv.import": "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
  "sync.complete": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  "department.create": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  "department.update": "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  "position.create": "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  "position.update": "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
  "BULK_UPDATE": "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  "UPDATE_CONFIG": "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (cursor) params.set("cursor", cursor);
      
      const response = await fetch(`/api/activity?${params.toString()}`);
      const data = await response.json();
      
      if (cursor) {
        setActivities(prev => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchActivities(), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = () => {
    if (nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchActivities(nextCursor);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-500" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          Activity Feed
          <span className="ml-auto text-xs font-normal text-slate-400">
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((activity, index) => {
                const Icon = actionIcons[activity.action] || Activity;
                const colorClass = actionColors[activity.action] || "bg-slate-100 text-slate-600";
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Actor Avatar */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        name={activity.actor.name}
                        imageUrl={activity.actor.avatarUrl}
                        className="h-9 w-9"
                      />
                      <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${colorClass}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Load More */}
          {hasMore && (
            <div className="p-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 hover:text-slate-700"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                Load more
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
