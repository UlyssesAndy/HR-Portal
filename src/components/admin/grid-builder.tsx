"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Grid3x3,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Section {
  id: string;
  type: "grid";
  columns: number;
  gap: string;
  blocks: Block[];
}

interface Block {
  id: string;
  component: string;
  props: Record<string, any>;
}

interface PageConfig {
  sections: Section[];
}

interface GridBuilderProps {
  page: string;
}

export function GridBuilder({ page }: GridBuilderProps) {
  const router = useRouter();
  const [config, setConfig] = useState<PageConfig>({ sections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Load page config
  useEffect(() => {
    loadConfig();
  }, [page]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/page-config?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || { sections: [] });
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type: "grid",
      columns: 2,
      gap: "24px",
      blocks: [],
    };

    setConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleRemoveSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/page-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, config }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleAddSection}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveStatus === "success" ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved!
            </>
          ) : saveStatus === "error" ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Error
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Layout
            </>
          )}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {config.sections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Grid3x3 className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 mb-4">
                No sections yet. Add your first section to start building the layout.
              </p>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            </CardContent>
          </Card>
        ) : (
          config.sections.map((section, index) => (
            <Card key={section.id} className="border-2 border-indigo-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-move" />
                  <Grid3x3 className="h-5 w-5 text-indigo-600" />
                  Section {index + 1}
                </CardTitle>
                <button
                  onClick={() => handleRemoveSection(section.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Columns
                    </label>
                    <select
                      value={section.columns}
                      onChange={(e) =>
                        handleUpdateSection(section.id, {
                          columns: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Gap
                    </label>
                    <input
                      type="text"
                      value={section.gap}
                      onChange={(e) =>
                        handleUpdateSection(section.id, { gap: e.target.value })
                      }
                      placeholder="24px"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Preview Grid */}
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[120px]"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${section.columns}, 1fr)`,
                    gap: section.gap,
                  }}
                >
                  {section.blocks.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center text-slate-400 text-sm">
                      Drop components here (coming in Day 3)
                    </div>
                  ) : (
                    section.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-center"
                      >
                        <span className="text-sm font-medium text-indigo-700">
                          {block.component}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Phase 2: Structure</p>
              <p className="text-sm text-blue-700 mt-1">
                Creating sections and configuring layout. Drag-and-drop components coming in Day 3!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
