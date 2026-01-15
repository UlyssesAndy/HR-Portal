"use client";

import { LucideIcon, Users, Building2, Briefcase, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: string;
  trend?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Activity,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    iconBg: "bg-gradient-to-br from-green-500 to-green-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-900",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-900",
    iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-900",
    iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
};

export function StatsCard({ title, value, icon = "Activity", color = "blue", trend }: StatsCardProps) {
  const Icon = ICON_MAP[icon] || Activity;
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <Card className={`${colors.bg} ${colors.border} border-2 hover:shadow-lg transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colors.text}`}>{value}</p>
            {trend && (
              <p className="text-xs text-slate-500 mt-1">{trend}</p>
            )}
          </div>
          <div className={`${colors.iconBg} p-3 rounded-xl shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
