import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ServicesList } from "@/components/admin/services-list";
import { Link2, Folder, Tag, LayoutGrid } from "lucide-react";

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
  const activeServices = services.filter(s => s.isActive).length;

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-6 text-white shadow-xl shadow-pink-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Services Management</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Configure service links, categories, and access permissions
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Link2 className="h-4 w-4" />
              <span className="font-semibold">{services.length}</span>
              <span className="text-white/80 text-sm">Total Services</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Tag className="h-4 w-4" />
              <span className="font-semibold">{activeServices}</span>
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Folder className="h-4 w-4" />
              <span className="font-semibold">{categories.length}</span>
              <span className="text-white/80 text-sm">Categories</span>
            </div>
          </div>
        </div>
      </div>

      <ServicesList services={services} categories={categories} />
    </div>
  );
}
