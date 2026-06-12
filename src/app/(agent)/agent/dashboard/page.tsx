import { Users, Sparkles, Calendar, DollarSign, UserPlus, Building2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed, ActivityItem } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { mockRecommendations } from "@/lib/mock-data";

const activityItems: ActivityItem[] = [
  {
    id: "a1",
    type: "match",
    title: "New AI match",
    description: "Alex Rivera matched 94% with Pine Ridge Dr",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "a2",
    type: "message",
    title: "Client message",
    description: "Sarah Chen asked about scheduling a tour",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "a3",
    type: "view",
    title: "Listing performance",
    description: "Downtown Condo received 28 views today",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export const metadata = {
  title: "Agent Dashboard",
};

export default function AgentDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Your clients, matches, and pipeline at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Clients" value="12" icon={Users} />
        <StatCard
          title="AI Matches"
          value={mockRecommendations.length}
          icon={Sparkles}
          variant="ai"
        />
        <StatCard title="Showings This Week" value="5" icon={Calendar} />
        <StatCard
          title="Pending Commission"
          value="$24,500"
          icon={DollarSign}
          variant="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed items={activityItems} />
        <QuickActions
          actions={[
            {
              label: "View AI Matches",
              description: "5 new matches to review",
              href: "/agent/matches",
              icon: Sparkles,
              variant: "ai",
            },
            {
              label: "Add Client",
              description: "Onboard a new buyer",
              href: "/agent/clients",
              icon: UserPlus,
            },
            {
              label: "Manage Clients",
              description: "View all client profiles",
              href: "/agent/clients",
              icon: Users,
            },
            {
              label: "Browse Listings",
              description: "Active inventory",
              href: "/properties",
              icon: Building2,
              variant: "accent",
            },
          ]}
        />
      </div>
    </div>
  );
}
