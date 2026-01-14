import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransitionWrapper } from "@/components/layout/page-transition-wrapper";
import { MobileNavWrapper } from "@/components/layout/mobile-nav-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a1a]">
      {/* Subtle background pattern for dark mode */}
      <div className="fixed inset-0 dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[size:60px_60px] pointer-events-none" />
      <div className="fixed inset-0 dark:bg-gradient-to-br dark:from-purple-900/10 dark:via-transparent dark:to-cyan-900/10 pointer-events-none" />
      
      <Sidebar user={session.user} />
      <main className="lg:pl-72 pb-20 lg:pb-0 relative">
        <div className="min-h-screen p-4 lg:p-8">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </div>
      </main>
      <MobileNavWrapper />
      <CommandPalette />
      <ToastProvider />
    </div>
  );
}
