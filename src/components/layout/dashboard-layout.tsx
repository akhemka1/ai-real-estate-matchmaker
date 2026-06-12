import { DashboardSidebar, SidebarItem } from "@/components/layout/dashboard-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: SidebarItem[];
  title?: string;
}

export function DashboardLayout({
  children,
  navItems,
  title,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar items={navItems} title={title} />
      <main id="main-content" className="flex-1 overflow-auto bg-background">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
