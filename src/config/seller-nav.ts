import { LayoutDashboard, Building2, Users, BarChart3, FileText } from "lucide-react";
import { SidebarItem } from "@/components/layout/dashboard-sidebar";

export const sellerNavItems: SidebarItem[] = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "My Listings", href: "/seller/listings", icon: Building2 },
  { label: "Leads", href: "/seller/leads", icon: Users, badge: "3" },
  { label: "Insights", href: "/seller/insights", icon: BarChart3 },
  { label: "Documents", href: "/seller/documents", icon: FileText },
];
