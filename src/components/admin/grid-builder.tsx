"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Grid3x3,
  Plus,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  GripVertical,
  Settings2,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentLibrary, ComponentDefinition, COMPONENT_LIBRARY } from "./component-library";

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
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddBlock = (component: ComponentDefinition) => {
    if (!selectedSection) return;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      component: component.id,
      props: component.defaultProps,
    };

    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === selectedSection
          ? { ...s, blocks: [...s.blocks, newBlock] }
          : s
      ),
    }));

    setShowComponentLibrary(false);
    setSelectedSection(null);
  };

  const handleRemoveBlock = (sectionId: string, blockId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }
          : s
      ),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setConfig(prev => {
      const oldIndex = prev.sections.findIndex(s => s.id === active.id);
      const newIndex = prev.sections.findIndex(s => s.id === over.id);

      return {
        ...prev,
        sections: arrayMove(prev.sections, oldIndex, newIndex),
      };
    });
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
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Main Area */}
      <div className="lg:col-span-9 space-y-6">
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

        {/* Sections with DnD */}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={config.sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {config.sections.map((section, index) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    index={index}
                    onRemove={handleRemoveSection}
                    onUpdate={handleUpdateSection}
                    onAddBlock={() => {
                      setSelectedSection(section.id);
                      setShowComponentLibrary(true);
                    }}
                    onRemoveBlock={handleRemoveBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Sidebar - Component Library */}
      <div className="lg:col-span-3">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              Components
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showComponentLibrary && selectedSection ? (
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Select a component to add to the section:
                </p>
                <ComponentLibrary onSelectComponent={handleAddBlock} />
                <button
                  onClick={() => {
                    setShowComponentLibrary(false);
                    setSelectedSection(null);
                  }}
                  className="mt-4 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Click "Add Component" in a section to start
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sortable Section Component
function SortableSection({
  section,
  index,
  onRemove,
  onUpdate,
  onAddBlock,
  onRemoveBlock,
}: {
  section: Section;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Section>) => void;
  onAddBlock: () => void;
  onRemoveBlock: (sectionId: string, blockId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-2 border-indigo-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-move p-1 hover:bg-slate-100 rounded"
            >
              <GripVertical className="h-5 w-5 text-slate-400" />
            </button>
            <Grid3x3 className="h-5 w-5 text-indigo-600" />
            Section {index + 1}
          </CardTitle>
          <button
            onClick={() => onRemove(section.id)}
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
                  onUpdate(section.id, {
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
                onChange={(e) => onUpdate(section.id, { gap: e.target.value })}
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
            {section.blocks.map((block) => {
              const componentDef = COMPONENT_LIBRARY.find(c => c.id === block.component);
              return (
                <div
                  key={block.id}
                  className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    {componentDef?.icon}
                    <span className="text-sm font-medium text-indigo-700">
                      {componentDef?.name || block.component}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveBlock(section.id, block.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Component Button */}
          <button
            onClick={onAddBlock}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Add Component
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
