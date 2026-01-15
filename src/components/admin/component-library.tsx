"use client";

import {
  BarChart3,
  Activity,
  Users,
  Square,
  Grid3x3,
} from "lucide-react";

export interface ComponentDefinition {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  defaultProps: Record<string, any>;
  propSchema: PropDefinition[];
}

export interface PropDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "select" | "color";
  label: string;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
}

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  {
    id: "StatsCard",
    name: "Stats Card",
    category: "Data Display",
    icon: <BarChart3 className="h-5 w-5" />,
    defaultProps: {
      title: "Total Employees",
      value: 0,
      icon: "Users",
      color: "blue",
    },
    propSchema: [
      { name: "title", type: "string", label: "Title", defaultValue: "Total Employees" },
      { name: "value", type: "number", label: "Value", defaultValue: 0 },
      {
        name: "icon",
        type: "select",
        label: "Icon",
        defaultValue: "Users",
        options: [
          { value: "Users", label: "Users" },
          { value: "Building2", label: "Building" },
          { value: "Briefcase", label: "Briefcase" },
          { value: "TrendingUp", label: "Trending Up" },
        ],
      },
      {
        name: "color",
        type: "select",
        label: "Color",
        defaultValue: "blue",
        options: [
          { value: "blue", label: "Blue" },
          { value: "green", label: "Green" },
          { value: "purple", label: "Purple" },
          { value: "orange", label: "Orange" },
        ],
      },
    ],
  },
  {
    id: "ActivityFeed",
    name: "Activity Feed",
    category: "Data Display",
    icon: <Activity className="h-5 w-5" />,
    defaultProps: {
      limit: 10,
      showAvatar: true,
    },
    propSchema: [
      { name: "limit", type: "number", label: "Items to Show", defaultValue: 10 },
      { name: "showAvatar", type: "boolean", label: "Show Avatar", defaultValue: true },
    ],
  },
  {
    id: "RecentEmployees",
    name: "Recent Employees",
    category: "Data Display",
    icon: <Users className="h-5 w-5" />,
    defaultProps: {
      limit: 5,
    },
    propSchema: [
      { name: "limit", type: "number", label: "Items to Show", defaultValue: 5 },
    ],
  },
  {
    id: "Card",
    name: "Card Container",
    category: "Containers",
    icon: <Square className="h-5 w-5" />,
    defaultProps: {
      title: "Card Title",
      padding: "medium",
    },
    propSchema: [
      { name: "title", type: "string", label: "Title", defaultValue: "Card Title" },
      {
        name: "padding",
        type: "select",
        label: "Padding",
        defaultValue: "medium",
        options: [
          { value: "none", label: "None" },
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
  },
  {
    id: "GridContainer",
    name: "Grid Container",
    category: "Containers",
    icon: <Grid3x3 className="h-5 w-5" />,
    defaultProps: {
      columns: 2,
      gap: "medium",
    },
    propSchema: [
      { name: "columns", type: "number", label: "Columns", defaultValue: 2 },
      {
        name: "gap",
        type: "select",
        label: "Gap",
        defaultValue: "medium",
        options: [
          { value: "none", label: "None" },
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
  },
];

export function ComponentLibrary({
  onSelectComponent,
}: {
  onSelectComponent: (component: ComponentDefinition) => void;
}) {
  const categories = Array.from(new Set(COMPONENT_LIBRARY.map((c) => c.category)));

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{category}</h3>
          <div className="space-y-2">
            {COMPONENT_LIBRARY.filter((c) => c.category === category).map((component) => (
              <button
                key={component.id}
                onClick={() => onSelectComponent(component)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
              >
                <div className="text-indigo-600">{component.icon}</div>
                <span className="text-sm font-medium text-slate-700">{component.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
