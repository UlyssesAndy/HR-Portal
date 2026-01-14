import Link from "next/link";
import { UserX } from "lucide-react";

export default function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
        <UserX className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Employee Not Found</h1>
      <p className="text-slate-500 mt-2 max-w-md">
        The employee profile you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/directory"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
      >
        Back to Directory
      </Link>
    </div>
  );
}
