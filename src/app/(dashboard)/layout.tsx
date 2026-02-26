import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile header — hidden on desktop */}
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 p-4 lg:pt-0 lg:p-8">
        {children}
      </main>
    </div>
  );
}
