import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockRecommendations, mockUser } from "@/lib/mock-data";

export const metadata = {
  title: "AI Matches",
};

export default function AgentMatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-ai/10 p-2.5">
          <Sparkles className="h-5 w-5 text-ai" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Matches</h1>
          <p className="text-muted-foreground">
            Property matches for your clients
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Showing matches for{" "}
          <span className="font-medium text-foreground">
            {mockUser.firstName} {mockUser.lastName}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {mockRecommendations.map((rec) => (
          <div
            key={rec.propertyId}
            className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-card sm:flex-row sm:items-center"
          >
            <img
              src={rec.property.images[0]}
              alt={rec.property.title}
              className="h-24 w-32 shrink-0 rounded object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-ai px-2.5 py-0.5 text-xs font-bold text-ai-foreground">
                  {rec.matchScore}% match
                </span>
                <span className="text-xs text-muted-foreground">
                  Rank #{rec.rank}
                </span>
              </div>
              <h2 className="mt-1 font-semibold">{rec.property.title}</h2>
              <p className="text-sm text-muted-foreground">
                {rec.property.address.city}, {rec.property.address.state} · $
                {rec.property.price.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/properties/${rec.propertyId}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
              <Button size="sm" variant="ai">
                Share with client
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
