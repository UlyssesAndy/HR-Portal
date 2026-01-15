"use client";

import { useState } from "react";
import { Download, Upload, FileJson, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigManagerProps {
  config: any;
  onImport: (config: any) => void;
}

export function ConfigManager({ config, onImport }: ConfigManagerProps) {
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `page-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        
        // Validate config structure
        if (!importedConfig.sections || !Array.isArray(importedConfig.sections)) {
          throw new Error("Invalid config structure");
        }

        onImport(importedConfig);
        setImportStatus("success");
        setImportMessage("Configuration imported successfully!");
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch (error) {
        setImportStatus("error");
        setImportMessage("Failed to import: Invalid JSON file");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-indigo-600" />
          Config Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export */}
        <div>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Config as JSON
          </button>
        </div>

        {/* Import */}
        <div>
          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            Import Config from JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Status */}
        {importStatus !== "idle" && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              importStatus === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {importStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{importMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
