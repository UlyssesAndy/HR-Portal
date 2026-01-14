"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Plus,
  Loader2,
  X,
  Check,
} from "lucide-react";

interface PendingRequest {
  id: string;
  email: string;
  fullName: string | null;
  source: string;
  sourceReference: string | null;
  status: string;
  requestedAt: Date | string;
  reviewedAt: Date | string | null;
  reviewNote: string | null;
  employee?: { id: string; fullName: string; email: string } | null;
  reviewedBy?: { id: string; fullName: string } | null;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface PendingAccessListProps {
  requests: PendingRequest[];
  stats: Stats;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; badge: "warning" | "success" | "secondary" | "default" }> = {
  PENDING: { icon: Clock, color: "text-amber-500", badge: "warning" },
  APPROVED: { icon: CheckCircle, color: "text-green-500", badge: "success" },
  REJECTED: { icon: XCircle, color: "text-red-500", badge: "default" },
  EXPIRED: { icon: XCircle, color: "text-slate-400", badge: "secondary" },
};

export function PendingAccessList({ requests, stats }: PendingAccessListProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // New request form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredRequests = requests.filter(
    (r) => filter === "ALL" || r.status === filter
  );

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pending-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName || null,
          note: newNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add request");
      }

      setNewEmail("");
      setNewName("");
      setNewNote("");
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddLoading(false);
    }
  }

  async function processRequest(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/pending-access/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Add */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Add Request
        </button>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((request) => {
              const config = statusConfig[request.status] || statusConfig.PENDING;
              const StatusIcon = config.icon;

              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center ${config.color}`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {request.fullName || request.email.split("@")[0]}
                        </h3>
                        <Badge variant={config.badge}>{request.status}</Badge>
                        <Badge variant="secondary">{request.source}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{request.email}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        {request.sourceReference && ` • Ref: ${request.sourceReference}`}
                      </p>
                    </div>
                  </div>

                  {request.status === "PENDING" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => processRequest(request.id, "reject")}
                        disabled={processingId === request.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => processRequest(request.id, "approve")}
                        disabled={processingId === request.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-sm text-slate-500">
                      {request.reviewedBy && (
                        <p>By: {request.reviewedBy.fullName}</p>
                      )}
                      {request.reviewedAt && (
                        <p>{new Date(request.reviewedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No {filter !== "ALL" ? filter.toLowerCase() : ""} access requests
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Access Request</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={addRequest} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@external.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g., Contractor for Project X"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
