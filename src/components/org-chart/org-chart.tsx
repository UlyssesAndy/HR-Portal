"use client";

import { useState, useCallback } from "react";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, ChevronRight, Users, MapPin, Building2, 
  Briefcase, ExternalLink, Minus, Plus
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  position: { title: string } | null;
  department: { name: string } | null;
  location: string | null;
  directReports: Employee[];
}

interface OrgChartProps {
  rootEmployees: Employee[];
}

interface NodeProps {
  employee: Employee;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

function OrgNode({ employee, level, isExpanded, onToggle }: NodeProps) {
  const hasReports = employee.directReports.length > 0;
  
  const levelColors = [
    "border-blue-500 bg-blue-50",
    "border-emerald-500 bg-emerald-50",
    "border-purple-500 bg-purple-50",
    "border-amber-500 bg-amber-50",
    "border-rose-500 bg-rose-50",
  ];
  
  const colorClass = levelColors[level % levelColors.length];

  return (
    <div className="relative">
      {/* Node card */}
      <div 
        className={`relative group flex items-start gap-4 p-4 rounded-xl border-2 ${colorClass} transition-all hover:shadow-lg`}
      >
        {/* Toggle button */}
        {hasReports && (
          <button
            onClick={() => onToggle(employee.id)}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
          >
            {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        )}
        
        {/* Avatar */}
        <Link href={`/profile/${employee.id}`}>
          <UserAvatar 
            name={employee.fullName} 
            imageUrl={employee.avatarUrl} 
            className="h-12 w-12 ring-2 ring-white shadow"
          />
        </Link>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/profile/${employee.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            {employee.fullName}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          
          {employee.position && (
            <p className="text-sm text-slate-600 flex items-center gap-1 mt-0.5">
              <Briefcase className="h-3 w-3" />
              {employee.position.title}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {employee.department && (
              <Badge variant="secondary" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {employee.department.name}
              </Badge>
            )}
            {employee.location && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {employee.location}
              </Badge>
            )}
            {hasReports && (
              <Badge variant="default" className="text-xs bg-slate-900">
                <Users className="h-3 w-3 mr-1" />
                {employee.directReports.length}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgTree({ 
  employees, 
  level = 0, 
  expandedNodes, 
  onToggle 
}: { 
  employees: Employee[]; 
  level?: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (employees.length === 0) return null;

  return (
    <div className={`space-y-4 ${level > 0 ? "ml-8 pl-8 border-l-2 border-dashed border-slate-200" : ""}`}>
      {employees.map((employee) => {
        const isExpanded = expandedNodes.has(employee.id);
        const hasReports = employee.directReports.length > 0;
        
        return (
          <div key={employee.id}>
            <OrgNode 
              employee={employee} 
              level={level}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
            
            {/* Children */}
            {hasReports && isExpanded && (
              <div className="mt-4">
                <OrgTree 
                  employees={employee.directReports}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrgChart({ rootEmployees }: OrgChartProps) {
  // Start with first 2 levels expanded
  const getInitialExpanded = useCallback(() => {
    const set = new Set<string>();
    rootEmployees.forEach(emp => {
      set.add(emp.id);
      emp.directReports.forEach(sub => set.add(sub.id));
    });
    return set;
  }, [rootEmployees]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(getInitialExpanded);
  
  const handleToggle = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const collectIds = (emps: Employee[]): string[] => {
      return emps.flatMap(emp => [emp.id, ...collectIds(emp.directReports)]);
    };
    setExpandedNodes(new Set(collectIds(rootEmployees)));
  }, [rootEmployees]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  if (rootEmployees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">No org structure found</p>
        <p className="text-sm text-slate-400 mt-1">Add managers to employees to build the org chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <ChevronDown className="h-4 w-4" />
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          Collapse All
        </button>
        <span className="text-sm text-slate-400 ml-auto">
          {rootEmployees.length} top-level {rootEmployees.length === 1 ? "employee" : "employees"}
        </span>
      </div>
      
      {/* Tree */}
      <OrgTree 
        employees={rootEmployees}
        expandedNodes={expandedNodes}
        onToggle={handleToggle}
      />
    </div>
  );
}
