"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { sellerNavItems } from "@/config/seller-nav";
import { siteConfig } from "@/config/site";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout navItems={sellerNavItems} title={`${siteConfig.name} Seller`}>
      {children}
    </DashboardLayout>
  );
}
