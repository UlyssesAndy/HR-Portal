"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { 
  ChevronDown, ChevronUp, Mail, Phone, Calendar, MapPin, 
  Building2, Briefcase, MessageSquare, AlertTriangle,
  ExternalLink, User
} from "lucide-react";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  department: { id: string; name: string } | null;
  position: { id: string; title: string } | null;
  manager: { id: string; fullName: string; avatarUrl: string | null } | null;
  // Extended fields
  isManager?: boolean;
  location?: string | null;
  birthDate?: string | null;
  startDate?: string | null;
  mattermostUsername?: string | null;
  telegramHandle?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactEmail?: string | null;
}

interface ExpandableEmployeeCardProps {
  employee: Employee;
  mattermostUrl?: string;
}

const statusConfig: Record<string, { color: "success" | "warning" | "secondary" | "default" | "destructive"; label: string }> = {
  ACTIVE: { color: "success", label: "Active" },
  ON_LEAVE: { color: "warning", label: "On Leave" },
  DAY_OFF: { color: "secondary", label: "Day Off" },
  MATERNITY: { color: "warning", label: "Maternity" },
  PENDING: { color: "secondary", label: "Pending" },
  TERMINATED: { color: "destructive", label: "Terminated" },
};

// Mattermost icon component
function MattermostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.081 2C6.513 2 2 6.476 2 12s4.513 10 10.081 10c5.569 0 10.081-4.476 10.081-10S17.65 2 12.081 2zm0 18.462c-4.678 0-8.477-3.77-8.477-8.462 0-4.691 3.799-8.462 8.477-8.462 4.679 0 8.478 3.77 8.478 8.462 0 4.691-3.8 8.462-8.478 8.462z"/>
      <path d="M16.57 7.41c-.957-.956-2.23-1.482-3.585-1.482-1.356 0-2.629.526-3.586 1.482-.956.957-1.483 2.23-1.483 3.586 0 1.355.527 2.628 1.483 3.585l3.586 3.586 3.585-3.586c.957-.957 1.483-2.23 1.483-3.585 0-1.356-.526-2.63-1.483-3.586zm-3.585 5.657c-1.145 0-2.071-.927-2.071-2.071 0-1.145.926-2.072 2.071-2.072 1.144 0 2.071.927 2.071 2.072 0 1.144-.927 2.071-2.071 2.071z"/>
    </svg>
  );
}

// Telegram icon component
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export function ExpandableEmployeeCard({ employee, mattermostUrl = "https://mattermost.company.com" }: ExpandableEmployeeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusInfo = statusConfig[employee.status] || { color: "default" as const, label: employee.status };
  
  const hasEmergencyContact = employee.emergencyContactName || employee.emergencyContactPhone || employee.emergencyContactEmail;
  
  // Format date helper
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };
  
  // Format birthday (without year)
  const formatBirthday = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric"
    });
  };

  return (
    <Card className={`group transition-all duration-300 ${
      isExpanded 
        ? "shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20" 
        : "hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
    }`}>
      <CardContent className="p-0">
        {/* Main Card Content (Always Visible) */}
        <div 
          className="p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar with Status Badge */}
            <div className="relative mb-4">
              <UserAvatar
                name={employee.fullName}
                imageUrl={employee.avatarUrl}
                className="h-20 w-20 text-xl ring-4 ring-slate-100 dark:ring-slate-800 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900/50 transition-all"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {/* Manager Badge */}
                {employee.isManager && (
                  <Badge className="text-xs px-2 bg-blue-600 text-white shadow-sm">
                    Manager
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Status Badge (separate row) */}
            <div className="mb-3">
              <Badge variant={statusInfo.color} className="text-xs px-2 shadow-sm">
                {statusInfo.label}
              </Badge>
            </div>

            {/* Name */}
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {employee.fullName}
            </h3>

            {/* Position */}
            {employee.position && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                <span>{employee.position.title}</span>
              </div>
            )}

            {/* Department */}
            {employee.department && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Building2 className="h-3.5 w-3.5 text-purple-500" />
                <span>{employee.department.name}</span>
              </div>
            )}

            {/* Expand/Collapse Indicator */}
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-400">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Less details</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>More details</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-6 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Contact Row */}
            <div className="grid grid-cols-1 gap-3">
              {/* Email */}
              <a 
                href={`mailto:${employee.email}`}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{employee.email}</span>
              </a>
              
              {/* Mattermost Link */}
              {employee.mattermostUsername && (
                <a 
                  href={`${mattermostUrl}/messages/@${employee.mattermostUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <MattermostIcon className="h-4 w-4 text-blue-500" />
                  <span>@{employee.mattermostUsername}</span>
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              )}
              
              {/* Birthday */}
              {employee.birthDate && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <span>Birthday: {formatBirthday(employee.birthDate)}</span>
                </div>
              )}
              
              {/* Location */}
              {employee.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{employee.location}</span>
                </div>
              )}
            </div>
            
            {/* Manager & Start Date */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Manager */}
              {employee.manager && (
                <Link 
                  href={`/profile/${employee.manager.id}`}
                  className="flex items-center gap-2 group/manager"
                >
                  <UserAvatar
                    name={employee.manager.fullName}
                    imageUrl={employee.manager.avatarUrl}
                    className="h-8 w-8 text-xs"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Manager</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover/manager:text-indigo-600 truncate">
                      {employee.manager.fullName}
                    </p>
                  </div>
                </Link>
              )}
              
              {/* Start Date */}
              {employee.startDate && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Start Date</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(employee.startDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Emergency Contacts */}
            {hasEmergencyContact && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Emergency Contacts
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {employee.emergencyContactName && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{employee.emergencyContactName}</span>
                    </div>
                  )}
                  {employee.emergencyContactPhone && (
                    <a 
                      href={`tel:${employee.emergencyContactPhone}`}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{employee.emergencyContactPhone}</span>
                    </a>
                  )}
                  {employee.emergencyContactEmail && (
                    <a 
                      href={`mailto:${employee.emergencyContactEmail}`}
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{employee.emergencyContactEmail}</span>
                    </a>
                  )}
                  {employee.telegramHandle && (
                    <a 
                      href={`https://t.me/${employee.telegramHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500"
                    >
                      <TelegramIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span>{employee.telegramHandle}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* View Profile Link */}
            <div className="pt-3">
              <Link
                href={`/profile/${employee.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                View Full Profile
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
