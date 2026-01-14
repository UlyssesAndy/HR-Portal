"use client";

import { useState } from "react";
import { 
  Bell, Mail, MessageSquare, Calendar, Users, 
  UserPlus, Save, Loader2, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  inApp: boolean;
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    id: "new_employee",
    label: "New Employee Joined",
    description: "When a new team member joins the company",
    icon: <UserPlus className="h-5 w-5 text-green-500" />,
    email: true,
    inApp: true,
  },
  {
    id: "team_changes",
    label: "Team Changes",
    description: "Updates to your department or direct reports",
    icon: <Users className="h-5 w-5 text-blue-500" />,
    email: true,
    inApp: true,
  },
  {
    id: "birthdays",
    label: "Birthday Reminders",
    description: "Upcoming birthdays in your team",
    icon: <Calendar className="h-5 w-5 text-pink-500" />,
    email: false,
    inApp: true,
  },
  {
    id: "announcements",
    label: "Company Announcements",
    description: "Important company-wide updates",
    icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
    email: true,
    inApp: true,
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSetting = (id: string, type: "email" | "inApp") => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, [type]: !s[type] } : s
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Mock save - in production this would call an API
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl shadow-lg dark:shadow-black/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end gap-8 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Email
          </div>
          <div className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            In-App
          </div>
        </div>

        {/* Settings List */}
        {settings.map(setting => (
          <div 
            key={setting.id}
            className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{setting.icon}</div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{setting.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{setting.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              {/* Email Toggle */}
              <button
                onClick={() => toggleSetting(setting.id, "email")}
                className={`
                  w-11 h-6 rounded-full transition-all duration-300 relative
                  ${setting.email 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30" 
                    : "bg-slate-200 dark:bg-slate-700"
                  }
                `}
              >
                <span 
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300
                    ${setting.email ? "translate-x-5" : "translate-x-1"}
                  `}
                />
              </button>

              {/* In-App Toggle */}
              <button
                onClick={() => toggleSetting(setting.id, "inApp")}
                className={`
                  w-11 h-6 rounded-full transition-all duration-300 relative
                  ${setting.inApp 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30" 
                    : "bg-slate-200 dark:bg-slate-700"
                  }
                `}
              >
                <span 
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300
                    ${setting.inApp ? "translate-x-5" : "translate-x-1"}
                  `}
                />
              </button>
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Saved!" : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
