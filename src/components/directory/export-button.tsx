"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  searchParams: {
    q?: string;
    department?: string;
    status?: string;
    manager?: string;
    location?: string;
    legalEntity?: string;
  };
}

export function ExportButton({ searchParams }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Build query string from current filters
      const params = new URLSearchParams();
      if (searchParams.q) params.set("q", searchParams.q);
      if (searchParams.department) params.set("department", searchParams.department);
      if (searchParams.status) params.set("status", searchParams.status);
      if (searchParams.manager) params.set("manager", searchParams.manager);
      if (searchParams.location) params.set("location", searchParams.location);
      if (searchParams.legalEntity) params.set("legalEntity", searchParams.legalEntity);

      const response = await fetch(`/api/export/employees?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Export failed");
        return;
      }

      // Get filename from header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "employees_export.csv";

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  );
}
