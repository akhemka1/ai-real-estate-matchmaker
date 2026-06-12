import { Building2, Eye, Users, TrendingUp, Plus, FileText } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed, ActivityItem } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { mockProperties } from "@/lib/mock-data";

const activityItems: ActivityItem[] = [
  {
    id: "a1",
    type: "view",
    title: "New property view",
    description: "Modern Craftsman viewed 12 times today",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "a2",
    type: "message",
    title: "New lead inquiry",
    description: "Sarah Chen inquired about Pine Ridge Dr",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "a3",
    type: "save",
    title: "Property saved",
    description: "Downtown Luxury Condo added to 3 wishlists",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export const metadata = {
  title: "Seller Dashboard",
};

export default function SellerDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your listings and leads
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Listings"
          value={mockProperties.length}
          icon={Building2}
        />
        <StatCard
          title="Total Views"
          value="248"
          trend={{ value: 12, label: "vs last week" }}
          icon={Eye}
        />
        <StatCard
          title="New Leads"
          value="3"
          icon={Users}
          variant="ai"
        />
        <StatCard
          title="Avg. Days on Market"
          value="18"
          trend={{ value: -5, label: "vs average" }}
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed items={activityItems} />
        <QuickActions
          actions={[
            {
              label: "Add Listing",
              description: "Create a new property listing",
              href: "/seller/listings",
              icon: Plus,
              variant: "ai",
            },
            {
              label: "View Leads",
              description: "3 new inquiries waiting",
              href: "/seller/leads",
              icon: Users,
            },
            {
              label: "Manage Listings",
              description: "Edit or update your properties",
              href: "/seller/listings",
              icon: Building2,
            },
            {
              label: "Documents",
              description: "Contracts and disclosures",
              href: "/seller/documents",
              icon: FileText,
              variant: "accent",
            },
          ]}
        />
      </div>
    </div>
  );
}
