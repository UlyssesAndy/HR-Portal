import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { Settings, User, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Settings className="h-6 w-6 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl shadow-lg dark:shadow-black/20 border border-slate-200 dark:border-slate-800 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Email</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{session.user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Name</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{session.user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <Link 
          href="/settings/security"
          className="block bg-white dark:bg-slate-900/80 rounded-2xl shadow-lg dark:shadow-black/20 border border-slate-200 dark:border-slate-800 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Password, Two-Factor Authentication, Active Sessions
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
        </Link>

        {/* Notifications */}
        <NotificationSettings />
      </div>
    </div>
  );
}
