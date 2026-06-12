import Link from "next/link";
import { Sparkles, BarChart3, Tags, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockRecommendations } from "@/lib/mock-data";

const aiFeatures = [
  {
    icon: Sparkles,
    title: "Explainable Match Scores",
    description:
      "Every recommendation comes with a 0–100 match score and weighted factors like budget fit, commute, and lifestyle.",
  },
  {
    icon: BarChart3,
    title: "Multi-Factor Analysis",
    description:
      "Our AI weighs dozens of signals — school ratings, walkability, price trends, and your personal quiz results.",
  },
  {
    icon: Tags,
    title: "Computer Vision Tags",
    description:
      "Listing photos are automatically tagged for rooms, features, and condition to match your visual preferences.",
  },
  {
    icon: LineChart,
    title: "Appreciation Forecasts",
    description:
      "See AI-projected value growth at 1, 3, 5, and 10 year horizons with confidence intervals.",
  },
];

export const metadata = {
  title: "AI Matchmaking",
};

export default function AIMatchmakingPage() {
  const topMatch = mockRecommendations[0];

  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-ai/10 px-4 py-1.5 text-sm font-medium text-ai">
          <Sparkles className="h-4 w-4" />
          AI-Powered
        </div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Intelligent Property Matchmaking
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Not just search results — personalized matches with full transparency.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="rounded-lg border bg-card p-6 shadow-card">
              <div className="mb-4 inline-flex rounded-lg bg-ai/10 p-2.5 text-ai">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>

      {topMatch && (
        <div className="mx-auto mt-16 max-w-2xl rounded-lg border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Sample Match Breakdown</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {topMatch.property.title} — {topMatch.matchScore}% match
          </p>
          <div className="mt-4 space-y-3">
            {topMatch.reasons.map((reason) => (
              <div key={reason.factor} className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-ai"
                    style={{ width: `${reason.weight * 100}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-sm font-medium">{reason.factor}</span>
                <span className="flex-1 text-sm text-muted-foreground">
                  {reason.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link href="/recommendations">
          <Button variant="ai" size="lg">
            See your matches
          </Button>
        </Link>
      </div>
    </div>
  );
}
