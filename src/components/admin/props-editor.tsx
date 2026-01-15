"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save } from "lucide-react";
import { ComponentDefinition, PropDefinition } from "./component-library";

interface PropsEditorProps {
  component: ComponentDefinition;
  currentProps: Record<string, any>;
  onSave: (props: Record<string, any>) => void;
  onClose: () => void;
}

export function PropsEditor({ component, currentProps, onSave, onClose }: PropsEditorProps) {
  const [editedProps, setEditedProps] = useState<Record<string, any>>(currentProps);

  const handleChange = (propName: string, value: any) => {
    setEditedProps((prev) => ({
      ...prev,
      [propName]: value,
    }));
  };

  const handleSave = () => {
    onSave(editedProps);
    onClose();
  };

  return (
    <Card className="border-2 border-indigo-500 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {component.icon}
          Edit {component.name} Props
        </CardTitle>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {component.propSchema.map((propDef) => (
          <PropInput
            key={propDef.name}
            propDef={propDef}
            value={editedProps[propDef.name]}
            onChange={(value) => handleChange(propDef.name, value)}
          />
        ))}

        <div className="flex gap-2 pt-4">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PropInput({
  propDef,
  value,
  onChange,
}: {
  propDef: PropDefinition;
  value: any;
  onChange: (value: any) => void;
}) {
  const renderInput = () => {
    switch (propDef.type) {
      case "string":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        );

      case "boolean":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="text-sm text-slate-600">
              {value ? "Enabled" : "Disabled"}
            </span>
          </label>
        );

      case "select":
        return (
          <select
            value={value || propDef.defaultValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            {propDef.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "color":
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {propDef.label}
      </label>
      {renderInput()}
    </div>
  );
}
