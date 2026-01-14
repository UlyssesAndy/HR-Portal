import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PendingAccessList } from "@/components/admin/pending-access-list";

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Pending Access Requests
        </h1>
        <p className="text-slate-500 mt-1">
          Review and approve external user access requests
        </p>
      </div>

      <PendingAccessList requests={requests} stats={stats} />
    </div>
  );
}
