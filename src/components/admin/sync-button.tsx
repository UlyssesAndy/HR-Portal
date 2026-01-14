"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, RefreshCw, Loader2, CheckCircle } from "lucide-react";

interface SyncButtonProps {
  className?: string;
}

export function SyncButton({ className }: SyncButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check current sync status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Poll for status while running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      const stillRunning = await checkStatus();
      if (!stillRunning) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, router]);

  async function checkStatus() {
    try {
      const res = await fetch("/api/sync");
      if (res.ok) {
        const data = await res.json();
        setIsRunning(data.isRunning);
        return data.isRunning;
      }
    } catch {
      // Ignore errors
    }
    return false;
  }

  async function startSync() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start sync");
      }

      setIsRunning(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-medium transition-colors shadow-lg shadow-green-500/30 ${className}`}
      >
        <CheckCircle className="h-4 w-4" />
        Sync Complete!
      </button>
    );
  }

  if (isRunning) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-medium transition-colors shadow-lg shadow-amber-500/30 ${className}`}
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        Syncing...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={startSync}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Run Sync Now
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
