import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { Palette, Sun, Moon, Paintbrush } from "lucide-react";

export default async function ThemePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("ADMIN")) {
    redirect("/");
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-600 p-6 text-white shadow-xl shadow-purple-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Palette className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Theme Editor</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Customize colors, spacing, typography, and visual design
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Paintbrush className="h-4 w-4" />
              <span className="text-white/80 text-sm">Colors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Sun className="h-4 w-4" />
              <span className="text-white/80 text-sm">Light Mode</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Moon className="h-4 w-4" />
              <span className="text-white/80 text-sm">Dark Mode</span>
            </div>
          </div>
        </div>
      </div>

      <ThemeEditor />
    </div>
  );
}
