"use client";

import Link from "next/link";
import { ArrowRight, GitCompareArrows, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyComparison } from "@/components/property/property-comparison";
import { useCompareStore } from "@/stores/compare-store";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";
import { mockRecommendations } from "@/lib/mock-data";

export default function ComparePage() {
  const propertyIds = useCompareStore((s) => s.propertyIds);
  const clear = useCompareStore((s) => s.clear);
  const compareProperties = mockProperties.filter((p) =>
    propertyIds.includes(p.id)
  );

  const selectedRecommendations = mockRecommendations.filter((rec) =>
    propertyIds.includes(rec.propertyId)
  );

  const averageMatch =
    selectedRecommendations.length > 0
      ? Math.round(
          selectedRecommendations.reduce((sum, rec) => sum + rec.matchScore, 0) /
            selectedRecommendations.length
        )
      : 0;

  const averagePrice =
    compareProperties.length > 0
      ? compareProperties.reduce((sum, property) => sum + property.price, 0) /
        compareProperties.length
      : 0;

  const currencies = Array.from(
    new Set(compareProperties.map((property) => property.currency ?? "USD"))
  );

  const topMatch = selectedRecommendations.sort((a, b) => b.matchScore - a.matchScore)[0];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-ai/10 px-4 py-1.5 text-sm font-medium text-ai">
              <Sparkles className="h-4 w-4" />
              Side-by-side listing intelligence
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Compare listings like a real buyer or brokerage team
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Review pricing, size, location, and AI insights in one place so the best option is
              obvious instead of hidden inside tabs and filters.
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            {compareProperties.length > 0 && (
              <Button variant="outline" size="sm" onClick={clear}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {compareProperties.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected</p>
                <p className="mt-2 text-2xl font-bold">{compareProperties.length}</p>
                <p className="text-sm text-muted-foreground">properties to compare</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg. match</p>
                <p className="mt-2 text-2xl font-bold text-ai">{averageMatch}%</p>
                <p className="text-sm text-muted-foreground">from AI recommendations</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg. price</p>
                {currencies.length === 1 ? (
                  <>
                    <p className="mt-2 text-2xl font-bold">
                      {formatMarketPrice(averagePrice, "sale", currencies[0])}
                    </p>
                    <p className="text-sm text-muted-foreground">across selected listings</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-2xl font-bold">Mixed currencies</p>
                    <p className="text-sm text-muted-foreground">
                      {currencies.length} currencies represented
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Top pick</p>
                <p className="mt-2 text-base font-semibold">
                  {topMatch ? `#${topMatch.rank} · ${topMatch.property.title}` : "Choose listings"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topMatch ? `${topMatch.matchScore}% match` : "Add at least one listing"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {compareProperties.length === 0 ? (
          <div className="mt-12 overflow-hidden rounded-3xl border bg-card shadow-card">
            <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
              <div className="p-8">
                <GitCompareArrows className="h-12 w-12 text-muted-foreground/50" />
                <h2 className="mt-4 text-2xl font-bold">No listings selected yet</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Open any property card and add it to compare. This view will show the selected
                  homes side by side with AI price intelligence and key property facts.
                </p>
                <Link href="/properties" className="mt-6 inline-block">
                  <Button>
                    Browse properties
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="bg-muted/30 p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    "Price and currency",
                    "Size and room count",
                    "Location and market",
                    "AI estimated value",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border bg-background p-4 text-sm font-medium">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <PropertyComparison properties={compareProperties} />

            <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">What this view helps with</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      "Compare total cost across markets",
                      "Spot larger homes or better locations",
                      "See AI estimates and confidence together",
                      "Remove properties without losing context",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border bg-muted/20 p-4 text-sm">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-gradient-to-br from-ai/10 via-background to-secondary/40 shadow-card">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-ai">Need a deeper comparison?</p>
                  <h3 className="mt-2 text-xl font-bold">Use this before showing clients</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The compare view is designed to help brokerages, buyers, and sellers make
                    faster decisions with a clean, presentation-ready layout.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/properties">
                      <Button variant="outline">Add more listings</Button>
                    </Link>
                    {topMatch && (
                      <Link href={`/properties/${topMatch.property.id}`}>
                        <Button variant="ai">Open top match</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
