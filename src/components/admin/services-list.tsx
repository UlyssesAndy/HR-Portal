"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, ExternalLink, Edit, ChevronRight } from "lucide-react";
import { ServiceForm } from "./service-form";
import { CategoryForm } from "./category-form";

interface ServiceRole {
  role: string;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { services: number };
}

interface Service {
  id: string;
  title: string;
  description: string | null;
  url: string;
  iconUrl: string | null;
  categoryId: string | null;
  sortOrder: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
  visibleRoles?: ServiceRole[];
}

interface ServicesListProps {
  services: Service[];
  categories: Category[];
}

export function ServicesList({ services, categories }: ServicesListProps) {
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Services</p>
                <p className="text-2xl font-bold text-white">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active</p>
                <p className="text-2xl font-bold text-white">
                  {services.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowCategoryForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
        <button
          onClick={() => setShowServiceForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      {/* Categories */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => setEditCategory(category)}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group border border-slate-700/50"
              >
                <div>
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-slate-400">
                    {category._count?.services || 0} services
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.isActive ? "success" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                No categories yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">All Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-700/50">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => setEditService(service)}
                className="flex items-center justify-between py-4 hover:bg-slate-800/50 -mx-6 px-6 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-slate-600/50">
                    {service.iconUrl ? (
                      <img src={service.iconUrl} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <ExternalLink className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{service.title}</h3>
                      <Badge variant={service.isActive ? "success" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      <span className="truncate max-w-[300px]">{service.url}</span>
                      {service.category && (
                        <Badge variant="default">{service.category.name}</Badge>
                      )}
                    </div>
                    {service.visibleRoles && service.visibleRoles.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {service.visibleRoles.map((r) => (
                          <Badge key={r.role} variant="secondary" className="text-xs">
                            {r.role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}

            {services.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No services found. Add your first service!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forms */}
      {(showServiceForm || editService) && (
        <ServiceForm
          service={editService}
          categories={categories}
          onClose={() => {
            setShowServiceForm(false);
            setEditService(null);
          }}
        />
      )}

      {(showCategoryForm || editCategory) && (
        <CategoryForm
          category={editCategory}
          onClose={() => {
            setShowCategoryForm(false);
            setEditCategory(null);
          }}
        />
      )}
    </>
  );
}
