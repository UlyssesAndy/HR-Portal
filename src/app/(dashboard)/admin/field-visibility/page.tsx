import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FieldVisibilityManager } from "@/components/admin/field-visibility-manager";
import { Eye, Shield, Users, Lock } from "lucide-react";

export default async function FieldVisibilityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.roles?.includes("ADMIN");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-xl shadow-slate-900/30">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Field Visibility</h1>
          </div>
          <p className="text-white/70 mb-6 max-w-lg">
            Configure which fields are visible to each role across the application
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Shield className="h-4 w-4" />
              <span className="text-white/70 text-sm">Role-Based</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="text-white/70 text-sm">Directory Fields</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Lock className="h-4 w-4" />
              <span className="text-white/70 text-sm">Profile Fields</span>
            </div>
          </div>
        </div>
      </div>

      <FieldVisibilityManager />
    </div>
  );
}
