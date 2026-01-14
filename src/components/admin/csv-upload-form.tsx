"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, 
  Loader2, Play, AlertTriangle
} from "lucide-react";

interface DryRunResult {
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  preview: Array<{ email: string; fullName: string; action: "create" | "update" }>;
}

export function CsvUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setDryRunResult(null);
      setImportId(null);
      setError(null);
    }
  };

  const handleDryRun = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setDryRunResult(data.dryRun);
      setImportId(data.importId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!importId) return;

    setIsCommitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/csv/commit/${importId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Commit failed");
      }

      router.refresh();
      setFile(null);
      setDryRunResult(null);
      setImportId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDryRunResult(null);
    setImportId(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Upload CSV File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* File Input */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
            />
          </div>
          
          {file && !dryRunResult && (
            <button
              onClick={handleDryRun}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Dry Run
            </button>
          )}
        </div>

        {/* Dry Run Results */}
        {dryRunResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.validRows} Valid Rows</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.errorRows} Errors</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.preview.length} Previewed</span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {dryRunResult.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Validation Errors</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {dryRunResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-sm text-red-700">
                      Row {err.row}: <strong>{err.field}</strong> - {err.message}
                    </div>
                  ))}
                  {dryRunResult.errors.length > 10 && (
                    <div className="text-sm text-red-600 font-medium">
                      ...and {dryRunResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {dryRunResult.preview.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">Preview (first 10 rows)</h4>
                <div className="space-y-2">
                  {dryRunResult.preview.slice(0, 10).map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{row.email} - {row.fullName}</span>
                      <Badge variant={row.action === "create" ? "success" : "default"}>
                        {row.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              {dryRunResult.validRows > 0 && (
                <button
                  onClick={handleCommit}
                  disabled={isCommitting}
                  className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {isCommitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Commit Import
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
