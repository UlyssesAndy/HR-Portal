import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Link2, Grid3X3, ExternalLink, Sparkles } from "lucide-react";
import { ServicesContent } from "@/components/services/services-content";

async function getServices(userRoles: string[]) {
  const categories = await db.serviceCategory.findMany({
    where: { isActive: true },
    include: {
      services: {
        where: { 
          isActive: true,
          OR: [
            { visibleRoles: { none: {} } }, // No role restrictions
            { visibleRoles: { some: { role: { in: userRoles as any } } } },
          ],
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Also get uncategorized services
  const uncategorizedServices = await db.serviceLink.findMany({
    where: { 
      isActive: true,
      categoryId: null,
      OR: [
        { visibleRoles: { none: {} } },
        { visibleRoles: { some: { role: { in: userRoles as any } } } },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });

  return { categories, uncategorizedServices };
}

export default async function ServicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRoles = session.user.roles || ["EMPLOYEE"];
  const { categories, uncategorizedServices } = await getServices(userRoles);

  const totalServices = categories.reduce((acc, cat) => acc + cat.services.length, 0) + uncategorizedServices.length;

  // Transform data for client component
  const categoriesData = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    services: cat.services.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      url: s.url,
      iconUrl: s.iconUrl,
    })),
  }));

  const uncategorizedData = uncategorizedServices.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    url: s.url,
    iconUrl: s.iconUrl,
  }));

  return (
    <div className="space-y-8">
      {/* Header - Premium style with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Link2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Services Hub</h1>
              <p className="text-white/70 mt-1">
                All your company tools in one place
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-white/70" />
                <span className="text-lg font-bold">{totalServices}</span>
              </div>
              <p className="text-xs text-white/60">Services</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-lg font-bold">{categories.length}</span>
              </div>
              <p className="text-xs text-white/60">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services with Search */}
      <ServicesContent 
        categories={categoriesData} 
        uncategorizedServices={uncategorizedData} 
      />

      {/* Empty State */}
      {totalServices === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
            <Link2 className="h-10 w-10 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No services available</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            Services will appear here once configured by your administrator
          </p>
        </div>
      )}
    </div>
  );
}
