import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ServicesList } from "@/components/admin/services-list";

async function getServicesData() {
  const [categories, services] = await Promise.all([
    db.serviceCategory.findMany({
      include: { _count: { select: { services: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.serviceLink.findMany({
      include: { 
        category: { select: { id: true, name: true } },
        visibleRoles: true,
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);
  
  return { categories, services };
}

export default async function ServicesAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { categories, services } = await getServicesData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Services Management
        </h1>
        <p className="text-slate-500 mt-1">
          Configure service links and categories
        </p>
      </div>

      <ServicesList services={services} categories={categories} />
    </div>
  );
}
