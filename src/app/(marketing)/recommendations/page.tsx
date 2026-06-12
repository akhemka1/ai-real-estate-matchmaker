import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockRecommendations } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

export const metadata = {
  title: "AI Recommendations",
};

export default function RecommendationsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-ai/10 p-2.5">
            <Sparkles className="h-5 w-5 text-ai" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your AI Matches</h1>
            <p className="text-muted-foreground">
              Ranked by how well each property fits your preferences
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {mockRecommendations.map((rec) => (
            <div
              key={rec.propertyId}
              className="overflow-hidden rounded-lg border bg-card shadow-card"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-72 shrink-0">
                  <img
                    src={rec.property.images[0]}
                    alt={rec.property.title}
                    className="h-48 w-full object-cover md:h-full"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-ai px-3 py-1 text-sm font-bold text-ai-foreground">
                    #{rec.rank} · {rec.matchScore}% match
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-primary">
                        {formatMarketPrice(rec.property.price, rec.property.listingType, rec.property.currency)}
                      </p>
                      <h2 className="text-lg font-medium">{rec.property.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {rec.property.address.city}, {rec.property.address.state}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {rec.confidence}% confidence
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {rec.reasons.map((reason) => (
                      <div key={reason.factor} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 font-medium text-ai">
                          {reason.factor}
                        </span>
                        <span className="text-muted-foreground">
                          {reason.description}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4">
                    <Link href={`/properties/${rec.propertyId}`}>
                      <Button variant="outline" size="sm">
                        View property
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
