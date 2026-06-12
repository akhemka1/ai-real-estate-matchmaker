"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { agentNavItems } from "@/config/agent-nav";
import { siteConfig } from "@/config/site";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout navItems={agentNavItems} title={`${siteConfig.name} Agent`}>
      {children}
    </DashboardLayout>
  );
}
