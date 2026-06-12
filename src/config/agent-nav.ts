import {
  LayoutDashboard,
  Users,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { SidebarItem } from "@/components/layout/dashboard-sidebar";

export const agentNavItems: SidebarItem[] = [
  { label: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/agent/clients", icon: Users },
  { label: "AI Matches", href: "/agent/matches", icon: Sparkles, badge: "5" },
  { label: "Listings", href: "/agent/listings", icon: Building2 },
  { label: "Calendar", href: "/agent/calendar", icon: Calendar },
  { label: "Commissions", href: "/agent/commissions", icon: DollarSign },
];
