import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  Bed,
  CalendarDays,
  Check,
  Home,
  MapPin,
  Maximize,
  Ruler,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { ProposalButton } from "@/components/proposal/proposal-button";
import { PropertyShowcase } from "@/components/property/property-showcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice, formatNumber } from "@/lib/utils";

export function generateStaticParams() {
  return mockProperties.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);
  return { title: property?.title ?? "Property" };
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);
  if (!property) notFound();

  const facts = [
    { icon: Bed, label: "Bedrooms", value: property.bedrooms },
    { icon: Bath, label: "Bathrooms", value: property.bathrooms },
    { icon: Maximize, label: "Sqft", value: formatNumber(property.sqft) },
    { icon: Home, label: "Type", value: property.propertyType, capitalize: true },
    ...(property.yearBuilt
      ? [{ icon: CalendarDays, label: "Year built", value: property.yearBuilt }]
      : []),
    ...(property.lotSize
      ? [{ icon: Ruler, label: "Lot size", value: `${property.lotSize} ac` }]
      : []),
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-mesh-gradient" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="mb-5 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Button>
        </Link>

        <div className="animate-fade-up">
          <PropertyShowcase images={property.images} alt={property.title} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.85fr]">
          {/* Main content */}
          <div className="space-y-6">
            <section className="animate-fade-up delay-1 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ai" className="gap-1">
                  <Sparkles className="h-3 w-3" /> AI Verified
                </Badge>
                <Badge variant={property.status === "active" ? "success" : "warning"}>
                  {property.status.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {property.address.country}
                </Badge>
              </div>

              <p className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                {formatMarketPrice(property.price, property.listingType, property.currency)}
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {property.address.street}, {property.address.city}, {property.address.state}{" "}
                {property.address.zipCode}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {facts.map((f) => (
                  <div
                    key={f.label}
                    className="rounded-2xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                      <f.icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </p>
                    <p className={`mt-0.5 text-lg font-semibold ${f.capitalize ? "capitalize" : ""}`}>
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="animate-fade-up delay-2 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-semibold">About this home</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{property.description}</p>

              {property.amenities.length > 0 && (
                <div className="mt-7">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Amenities
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium"
                      >
                        <Check className="h-3.5 w-3.5 text-ai" />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {property.aiPriceEstimate && (
              <section className="gradient-border animate-fade-up delay-3 p-6 shadow-card sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ai/10 text-ai">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-gradient">AI Price Intelligence</h2>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Estimated value
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatMarketPrice(
                        property.aiPriceEstimate,
                        property.listingType,
                        property.currency
                      )}
                    </p>
                  </div>
                  {property.appreciationForecast && (
                    <div className="rounded-2xl bg-muted/30 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        5-year appreciation forecast
                      </p>
                      <p className="mt-1 text-2xl font-bold text-success">
                        +{property.appreciationForecast.year5}%
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand-gradient"
                            style={{ width: `${property.appreciationForecast.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {property.appreciationForecast.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sticky contact rail */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="animate-fade-up delay-2 rounded-3xl border bg-card p-6 shadow-elevated">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-2xl font-bold tracking-tight">
                  {formatMarketPrice(property.price, property.listingType, property.currency)}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {property.listingType}
                </Badge>
              </div>

              <div className="mt-4">
                <ProposalButton
                  label="Download proposal (PDF)"
                  variant="outline"
                  className="w-full"
                  data={{
                    title: property.title,
                    location: `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zipCode}`,
                    priceLabel: formatMarketPrice(property.price, property.listingType, property.currency),
                    description: property.description,
                    amenities: property.amenities,
                    highlights: [
                      { label: "Bedrooms", value: String(property.bedrooms) },
                      { label: "Bathrooms", value: String(property.bathrooms) },
                      { label: "Area", value: `${formatNumber(property.sqft)} sqft` },
                      { label: "Type", value: property.propertyType },
                      ...(property.yearBuilt ? [{ label: "Year built", value: String(property.yearBuilt) }] : []),
                      ...(property.aiPriceEstimate
                        ? [{ label: "AI estimate", value: formatMarketPrice(property.aiPriceEstimate, property.listingType, property.currency) }]
                        : []),
                    ],
                  }}
                />
              </div>

              <h2 className="mt-6 text-lg font-semibold">Contact about this property</h2>
              <div className="mt-4">
                <InquiryForm propertyId={property.id} propertyTitle={property.title} />
              </div>

              <div className="mt-6 space-y-2.5 border-t pt-5 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-ai" />
                  Smart match score ready
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Transparent AI insights
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <TimerReset className="h-4 w-4 text-primary" />
                  Fast decision support
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
