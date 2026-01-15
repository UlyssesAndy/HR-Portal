import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/admin/theme-editor";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Theme Editor
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Customize colors, spacing, typography, and visual design
        </p>
      </div>

      <ThemeEditor />
    </div>
  );
}
