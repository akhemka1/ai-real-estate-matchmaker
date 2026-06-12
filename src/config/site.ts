import { UserRole } from "@/types";

export const siteConfig = {
  name: "NestMatch AI",
  tagline: "Where AI meets your dream home",
  description:
    "Intelligent real estate matchmaking with explainable AI recommendations.",
  url: "https://nestmatch.ai",
  keywords: [
    "real estate AI",
    "property matchmaking",
    "global real estate platform",
    "buyer lead generation",
    "agent CRM",
  ],
  markets: ["India", "USA", "Canada", "UK", "UAE"],
};

export const navLinks = {
  marketing: [
    { label: "Off-Plan", href: "/off-plan" },
    { label: "AI Studio", href: "/ai-studio" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog", href: "/blog" },
  ],
  buyer: [
    { label: "Search", href: "/properties" },
    { label: "AI Matches", href: "/recommendations" },
    { label: "Saved", href: "/saved" },
    { label: "Map", href: "/properties/map" },
  ],
  seller: [
    { label: "Dashboard", href: "/seller/dashboard" },
    { label: "My Listings", href: "/seller/listings" },
    { label: "Leads", href: "/seller/leads" },
  ],
  agent: [
    { label: "Dashboard", href: "/agent/dashboard" },
    { label: "Clients", href: "/agent/clients" },
    { label: "Matches", href: "/agent/matches" },
    { label: "Calendar", href: "/agent/calendar" },
  ],
};

export const roleDashboardPath: Record<UserRole, string> = {
  buyer: "/recommendations",
  renter: "/recommendations",
  seller: "/seller/dashboard",
  agent: "/agent/dashboard",
  admin: "/admin",
};
