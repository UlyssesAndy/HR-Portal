import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GridBuilder } from "@/components/admin/grid-builder";

interface PageBuilderProps {
  params: Promise<{
    page: string;
  }>;
}

const pageNames: Record<string, string> = {
  dashboard: "Dashboard",
  directory: "Directory",
  profile: "Profile",
};

export default async function PageBuilderPage({ params }: PageBuilderProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { page } = await params;
  const pageName = pageNames[page] || page;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Page Builder - {pageName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Customize layout, add sections, and arrange components
        </p>
      </div>

      <GridBuilder page={page} />
    </div>
  );
}
