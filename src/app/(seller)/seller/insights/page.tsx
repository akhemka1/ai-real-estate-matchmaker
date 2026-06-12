import { Eye, Users, Heart, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { mockProperties } from "@/lib/mock-data";

const viewsByListing = mockProperties.map((p, i) => ({
  title: p.title,
  city: p.address.city,
  views: [248, 164, 97][i] ?? 60,
  leads: [9, 5, 2][i] ?? 1,
}));

const maxViews = Math.max(...viewsByListing.map((v) => v.views));

export const metadata = {
  title: "Insights",
};

export default function SellerInsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">
          How your listings are performing with buyers
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value="509"
          trend={{ value: 14, label: "vs last week" }}
          icon={Eye}
        />
        <StatCard
          title="Total Leads"
          value="16"
          trend={{ value: 8, label: "vs last week" }}
          icon={Users}
          variant="ai"
        />
        <StatCard title="Saves" value="42" icon={Heart} variant="accent" />
        <StatCard
          title="View → Lead Rate"
          value="3.1%"
          trend={{ value: 2, label: "vs average" }}
          icon={TrendingUp}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Views by listing</h2>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
        <div className="mt-6 space-y-5">
          {viewsByListing.map((listing) => (
            <div key={listing.title}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{listing.title}</span>
                <span className="text-muted-foreground">
                  {listing.views} views · {listing.leads} leads
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-ai transition-all duration-500 ease-premium"
                  style={{ width: `${(listing.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
