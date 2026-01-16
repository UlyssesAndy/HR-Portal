import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PendingAccessList } from "@/components/admin/pending-access-list";
import { UserPlus, Clock, CheckCircle, XCircle } from "lucide-react";

async function getPendingAccessData() {
  const requests = await db.pendingAccess.findMany({
    include: {
      employee: { select: { id: true, fullName: true, email: true } },
      reviewedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  const stats = {
    pending: requests.filter(r => r.status === "PENDING").length,
    approved: requests.filter(r => r.status === "APPROVED").length,
    rejected: requests.filter(r => r.status === "REJECTED").length,
    total: requests.length,
  };

  return { requests, stats };
}

export default async function PendingAccessPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const { requests, stats } = await getPendingAccessData();

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${
        stats.pending > 0 
          ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-orange-500/20"
          : "bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 shadow-emerald-500/20"
      }`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Pending Access Requests</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Review and approve external user access requests
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{stats.pending}</span>
              <span className="text-white/80 text-sm">Pending</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{stats.approved}</span>
              <span className="text-white/80 text-sm">Approved</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold">{stats.rejected}</span>
              <span className="text-white/80 text-sm">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      <PendingAccessList requests={requests} stats={stats} />
    </div>
  );
}
