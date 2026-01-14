import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
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
      {/* Header - Premium style */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Services Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quick access to {totalServices} company services and tools
        </p>
      </div>

      {/* Featured Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Link2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">All Your Tools in One Place</h2>
            <p className="text-white/80 text-sm">
              Access company services based on your role and permissions
            </p>
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Link2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No services available</h3>
          <p className="text-slate-500 mt-1">Contact your administrator to add services</p>
        </div>
      )}
    </div>
  );
}
