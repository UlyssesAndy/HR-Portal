"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Grid3X3, Star, Zap, Layers, Search, X } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string | null;
  url: string;
  iconUrl: string | null;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

interface ServicesContentProps {
  categories: Category[];
  uncategorizedServices: Service[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Communication": <Grid3X3 className="h-5 w-5" />,
  "HR & People": <Star className="h-5 w-5" />,
  "Development": <Zap className="h-5 w-5" />,
  "default": <Layers className="h-5 w-5" />,
};

const categoryGradients: Record<string, string> = {
  "Communication": "from-blue-500 to-cyan-500",
  "HR & People": "from-purple-500 to-pink-500",
  "Development": "from-orange-500 to-amber-500",
  "Finance": "from-green-500 to-emerald-500",
  "default": "from-slate-500 to-slate-600",
};

export function ServicesContent({ categories, uncategorizedServices }: ServicesContentProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter services based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { categories, uncategorizedServices };
    }

    const query = searchQuery.toLowerCase();
    
    const filteredCategories = categories.map(cat => ({
      ...cat,
      services: cat.services.filter(s => 
        s.title.toLowerCase().includes(query) ||
        (s.description?.toLowerCase().includes(query) ?? false)
      ),
    })).filter(cat => cat.services.length > 0);

    const filteredUncategorized = uncategorizedServices.filter(s =>
      s.title.toLowerCase().includes(query) ||
      (s.description?.toLowerCase().includes(query) ?? false)
    );

    return { 
      categories: filteredCategories, 
      uncategorizedServices: filteredUncategorized 
    };
  }, [searchQuery, categories, uncategorizedServices]);

  const totalFiltered = filteredData.categories.reduce((acc, cat) => acc + cat.services.length, 0) 
    + filteredData.uncategorizedServices.length;

  const totalServices = categories.reduce((acc, cat) => acc + cat.services.length, 0) 
    + uncategorizedServices.length;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search services by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-slate-500">
          Found {totalFiltered} of {totalServices} services
        </div>
      )}

      {/* Categories */}
      {filteredData.categories.map((category) => (
        category.services.length > 0 && (
          <section key={category.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${categoryGradients[category.name] || categoryGradients.default} flex items-center justify-center text-white shadow-lg`}>
                {categoryIcons[category.name] || categoryIcons.default}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
              <span className="ml-2 text-sm text-slate-400">
                {category.services.length} {category.services.length === 1 ? "service" : "services"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.services.map((service) => (
                <ServiceCard key={service.id} service={service} highlight={searchQuery} />
              ))}
            </div>
          </section>
        )
      ))}

      {/* Uncategorized */}
      {filteredData.uncategorizedServices.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white shadow-lg">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Other Services</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredData.uncategorizedServices.map((service) => (
              <ServiceCard key={service.id} service={service} highlight={searchQuery} />
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {totalFiltered === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No services found</h3>
          <p className="text-slate-500 mt-1">
            Try searching with different keywords
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  highlight?: string;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
    ) : part
  );
}

function ServiceCard({ service, highlight = "" }: ServiceCardProps) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <Card className="h-full hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
              {service.iconUrl ? (
                <img 
                  src={service.iconUrl} 
                  alt={service.title}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <ExternalLink className="h-5 w-5 text-slate-500" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {highlightText(service.title, highlight)}
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              
              {service.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {highlightText(service.description, highlight)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
