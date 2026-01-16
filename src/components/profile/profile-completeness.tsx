"use client";

import { CheckCircle, Circle, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileField {
  key: string;
  label: string;
  filled: boolean;
  required?: boolean;
  category: "basic" | "contact" | "work" | "personal";
}

interface ProfileCompletenessProps {
  employee: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    department: { name: string } | null;
    position: { title: string } | null;
    manager: { id: string } | null;
    startDate: Date | null;
    birthDate: Date | null;
    location: string | null;
    timezone: string | null;
    mattermostUsername: string | null;
    telegramHandle: string | null;
  };
  showDetails?: boolean;
}

export function ProfileCompleteness({ employee, showDetails = true }: ProfileCompletenessProps) {
  const fields: ProfileField[] = [
    // Required fields
    { key: "fullName", label: "Full Name", filled: !!employee.fullName, required: true, category: "basic" },
    { key: "email", label: "Email", filled: !!employee.email, required: true, category: "basic" },
    { key: "department", label: "Department", filled: !!employee.department, required: true, category: "work" },
    { key: "position", label: "Position", filled: !!employee.position, required: true, category: "work" },
    
    // Recommended fields
    { key: "avatarUrl", label: "Profile Photo", filled: !!employee.avatarUrl, category: "basic" },
    { key: "phone", label: "Phone Number", filled: !!employee.phone, category: "contact" },
    { key: "manager", label: "Manager", filled: !!employee.manager, category: "work" },
    { key: "startDate", label: "Start Date", filled: !!employee.startDate, category: "work" },
    { key: "location", label: "Location", filled: !!employee.location, category: "contact" },
    { key: "timezone", label: "Timezone", filled: !!employee.timezone, category: "contact" },
    
    // Optional fields
    { key: "birthDate", label: "Birthday", filled: !!employee.birthDate, category: "personal" },
    { key: "mattermostUsername", label: "Mattermost", filled: !!employee.mattermostUsername, category: "contact" },
    { key: "telegramHandle", label: "Telegram", filled: !!employee.telegramHandle, category: "contact" },
  ];

  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);

  const requiredFilled = requiredFields.filter(f => f.filled).length;
  const optionalFilled = optionalFields.filter(f => f.filled).length;
  
  // Score: required fields are worth more
  const requiredScore = (requiredFilled / requiredFields.length) * 60;
  const optionalScore = (optionalFilled / optionalFields.length) * 40;
  const totalScore = Math.round(requiredScore + optionalScore);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-lime-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "from-emerald-500 to-teal-500";
    if (score >= 70) return "from-lime-500 to-emerald-500";
    if (score >= 50) return "from-amber-500 to-orange-500";
    return "from-red-500 to-orange-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Work";
    return "Incomplete";
  };

  const missingRequired = requiredFields.filter(f => !f.filled);
  const missingRecommended = optionalFields.filter(f => !f.filled).slice(0, 3);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
      {/* Header with Score */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Profile Completeness</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getScoreLabel(totalScore)}
            </p>
          </div>
        </div>
        <div className={cn("text-3xl font-bold", getScoreColor(totalScore))}>
          {totalScore}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-3">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500",
              getProgressColor(totalScore)
            )}
            style={{ width: `${totalScore}%` }}
          />
        </div>
      </div>

      {/* Field Status */}
      {showDetails && (
        <div className="px-5 pb-4 space-y-4">
          {/* Missing Required */}
          {missingRequired.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Missing Required
              </p>
              <div className="flex flex-wrap gap-2">
                {missingRequired.map(field => (
                  <span 
                    key={field.key}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  >
                    <Circle className="h-3 w-3" />
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Recommended */}
          {missingRecommended.length > 0 && missingRequired.length === 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                Suggestions to improve
              </p>
              <div className="flex flex-wrap gap-2">
                {missingRecommended.map(field => (
                  <span 
                    key={field.key}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <Circle className="h-3 w-3" />
                    {field.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All complete */}
          {missingRequired.length === 0 && totalScore >= 90 && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Profile is fully complete!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
