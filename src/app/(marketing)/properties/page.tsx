"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Map, Sparkles, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyGrid } from "@/components/property/property-grid";
import { NaturalLanguageSearch } from "@/components/ai/natural-language-search";
import { mockProperties, mockRecommendations } from "@/lib/mock-data";
import { useFilterStore } from "@/stores/filter-store";
import { Card, CardContent } from "@/components/ui/card";

export default function PropertiesPage() {
  const { filters } = useFilterStore();

  const filtered = useMemo(() => {
    return mockProperties.filter((p) => {
      if (filters.listingType && p.listingType !== filters.listingType) return false;
      if (filters.minPrice && p.price < filters.minPrice) return false;
      if (filters.maxPrice && p.price > filters.maxPrice) return false;
      if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
      if (filters.bathrooms && p.bathrooms < filters.bathrooms) return false;
      if (filters.country && p.address.country !== filters.country) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const hay = `${p.title} ${p.address.city} ${p.address.state} ${p.address.country}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm">
            <Sparkles className="h-4 w-4 text-ai" />
            Search properties globally
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Search Properties</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse premium listings, filter by market, and use AI-powered natural language search.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1">
              <Globe2 className="h-4 w-4 text-ai" />
              India, North America, UK & UAE
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1">
              <Sparkles className="h-4 w-4 text-ai" />
              Explainable AI ranking
            </span>
          </div>
        </div>
        <Card className="border-none bg-gradient-to-br from-ai/10 via-background to-secondary/40 shadow-card">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <p className="text-sm font-medium text-ai">Marketplace snapshot</p>
              <p className="mt-2 text-2xl font-bold">{filtered.length} live matches</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Personalize by city, country, budget, home type, or square footage.
              </p>
            </div>
            <Button variant="outline" asChild className="mt-4 w-fit">
              <Link href="/properties/map">
                <Map className="mr-2 h-4 w-4" />
                Map view
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <NaturalLanguageSearch variant="compact" />
      </div>

      <div className="mt-6">
        <PropertyFilters />
      </div>

      <div className="mt-8">
        <PropertyGrid properties={filtered} recommendations={mockRecommendations} />
      </div>
    </div>
  );
}
