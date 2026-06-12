import Link from "next/link";
import { ArrowRight, BarChart3, Globe2, MapPin, Shield, Sparkles, TrendingUp } from "lucide-react";
import { NaturalLanguageSearch } from "@/components/ai/natural-language-search";
import {
  FinalCta,
  IntegrationsStrip,
  OffPlanTeaser,
  PlatformCapabilities,
  StatsBand,
  Testimonials,
} from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

const features = [
  {
    icon: Sparkles,
    title: "AI Matchmaking",
    description:
      "Get personalized property recommendations with explainable match scores.",
  },
  {
    icon: TrendingUp,
    title: "Price Intelligence",
    description:
      "AI-powered price estimates and appreciation forecasts for every listing.",
  },
  {
    icon: Shield,
    title: "Transparent Scoring",
    description:
      "See exactly why each property matches your budget, lifestyle, and priorities.",
  },
  {
    icon: MapPin,
    title: "Smart Search",
    description:
      "Search in natural language — no more endless filter tweaking.",
  },
];

export default function HomePage() {
  const featured = mockProperties.slice(0, 6);
  const markets = ["India", "USA", "Canada", "UK", "UAE"];

  return (
    <>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-ai/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-ai" />
              Built for brokerages, teams, and global real estate brands
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {siteConfig.tagline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {siteConfig.description} Designed for India, North America, and cross-border teams
              that need a premium product people actually trust.
            </p>
            <div className="mt-8 max-w-2xl">
              <NaturalLanguageSearch />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/recommendations">
                <Button variant="ai" size="lg">
                  <Sparkles className="h-4 w-4" />
                  View AI Matches
                </Button>
              </Link>
              <Link href="/properties">
                <Button variant="outline" size="lg">
                  Browse listings
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg">
                  How it works
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { value: "10+", label: "premium listings in demo" },
                { value: "5", label: "active global markets" },
                { value: "94%", label: "avg. match confidence" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-card/80 backdrop-blur">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-none bg-card shadow-card">
            <CardHeader className="space-y-3 bg-gradient-to-br from-ai/10 via-background to-secondary/40">
              <Badge variant="ai" className="w-fit">Global market pulse</Badge>
              <CardTitle className="text-2xl">Listings across premium residential markets</CardTitle>
              <CardDescription>
                A single interface for buyers and seller teams across India, the US, Canada,
                the UK, and the UAE.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {markets.map((market) => (
                  <div key={market} className="rounded-xl border bg-background p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe2 className="h-4 w-4 text-ai" />
                      {market}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      AI ranking, saved listings, and lead tracking ready.
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm font-medium">What makes it sellable</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explainable recommendations, premium visuals, and a clean dashboard model that
                  works for teams, brokerages, and agencies.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <StatsBand />

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-ai/10 p-2.5 text-ai">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured Properties</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A broader portfolio that feels like a live, premium marketplace.
              </p>
            </div>
            <Link href="/properties">
              <Button variant="ghost" className="gap-2">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="group overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {property.aiPriceEstimate && (
                    <span className="absolute left-3 top-3 rounded-full bg-ai px-2.5 py-1 text-xs font-medium text-ai-foreground shadow-sm">
                      AI Est. {formatMarketPrice(property.aiPriceEstimate, property.listingType, property.currency)}
                    </span>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium backdrop-blur">
                    {property.address.country}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-lg font-semibold text-primary">
                    {formatMarketPrice(property.price, property.listingType, property.currency)}
                  </p>
                  <h3 className="mt-1 font-medium">{property.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {property.address.city}, {property.address.state} · {" "}
                    {property.bedrooms} bed · {property.bathrooms} bath ·{" "}
                    {property.sqft.toLocaleString()} sqft
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <OffPlanTeaser />
      <PlatformCapabilities />
      <IntegrationsStrip />
      <Testimonials />
      <FinalCta />
    </>
  );
}
