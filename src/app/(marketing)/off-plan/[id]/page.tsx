import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  FileText,
  MapPin,
  TrendingUp,
} from "lucide-react";

import { PaymentCalculator } from "@/components/offplan/payment-calculator";
import { ProposalButton } from "@/components/proposal/proposal-button";
import { PropertyShowcase } from "@/components/property/property-showcase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";
import { formatMarketPrice, formatNumber } from "@/lib/utils";

export function generateStaticParams() {
  return mockProjects.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const project = mockProjects.find((p) => p.id === params.id);
  return { title: project?.name ?? "Project" };
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = mockProjects.find((p) => p.id === params.id);
  if (!project) notFound();

  const stats = [
    { icon: CalendarClock, label: "Completion", value: project.completion },
    { icon: TrendingUp, label: "Rental yield", value: `${project.rentalYield}%`, accent: "text-success" },
    { icon: TrendingUp, label: "5-yr appreciation", value: `+${project.appreciation5yr}%`, accent: "text-success" },
    { icon: FileText, label: "Payment plan", value: project.paymentPlanLabel },
  ];

  const segments = [
    { label: "Booking", pct: project.downPaymentPct, className: "bg-primary" },
    { label: "Construction", pct: project.duringConstructionPct, className: "bg-accent" },
    { label: "Handover", pct: project.handoverPct, className: "bg-ai" },
  ].filter((s) => s.pct > 0);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-mesh-gradient" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link href="/off-plan">
          <Button variant="ghost" size="sm" className="mb-5 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            All projects
          </Button>
        </Link>

        <div className="animate-fade-up">
          <PropertyShowcase images={project.images} alt={project.name} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.85fr]">
          <div className="space-y-6">
            <section className="animate-fade-up delay-1 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ai" className="capitalize">{project.status.replace("-", " ")}</Badge>
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" /> {project.developer}
                </Badge>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">Starting from</p>
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                {formatMarketPrice(project.priceFrom, "sale", project.currency)}
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{project.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {project.city}, {project.country}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border bg-muted/30 p-4">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </p>
                    <p className={`mt-0.5 text-lg font-semibold ${s.accent ?? ""}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="animate-fade-up delay-2 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-semibold">Overview</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{project.description}</p>

              {/* Payment plan timeline */}
              <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Payment structure
              </h3>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                {segments.map((s) => (
                  <div key={s.label} className={s.className} style={{ width: `${s.pct}%` }} />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {segments.map((s) => (
                  <span key={s.label} className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${s.className}`} />
                    {s.label} · {s.pct}%
                  </span>
                ))}
              </div>

              {/* Amenities */}
              <h3 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Amenities
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-medium"
                  >
                    <Check className="h-3.5 w-3.5 text-ai" />
                    {a}
                  </span>
                ))}
              </div>
            </section>

            {/* Unit types */}
            <section className="animate-fade-up delay-3 overflow-hidden rounded-3xl border bg-card shadow-card">
              <div className="border-b p-6 sm:px-8">
                <h2 className="text-lg font-semibold">Available units</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-medium sm:px-8">Type</th>
                      <th className="px-6 py-3 font-medium">Size</th>
                      <th className="px-6 py-3 font-medium">From</th>
                      <th className="px-6 py-3 text-right font-medium sm:px-8">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {project.unitTypes.map((u) => (
                      <tr key={u.type} className="transition-colors hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium sm:px-8">{u.type}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatNumber(u.sizeSqft)} sqft</td>
                        <td className="px-6 py-4 font-semibold">
                          {formatMarketPrice(u.priceFrom, "sale", project.currency)}
                        </td>
                        <td className="px-6 py-4 text-right sm:px-8">
                          <Badge variant={u.available > 0 ? "success" : "secondary"}>
                            {u.available} left
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Location */}
            <section className="animate-fade-up rounded-3xl border bg-card p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-semibold">Location &amp; connectivity</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.location.nearby.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1.5 text-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {n}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky rail */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="animate-fade-up delay-2">
              <PaymentCalculator
                priceFrom={project.priceFrom}
                currency={project.currency}
                downPaymentPct={project.downPaymentPct}
                duringConstructionPct={project.duringConstructionPct}
                handoverPct={project.handoverPct}
              />
            </div>
            <div className="animate-fade-up delay-3 rounded-3xl border bg-card p-6 shadow-elevated">
              <p className="text-sm text-muted-foreground">Interested in {project.name}?</p>
              <div className="mt-4 grid gap-2">
                <ProposalButton
                  label="Request proposal (PDF)"
                  className="w-full"
                  data={{
                    title: project.name,
                    subtitle: `By ${project.developer}`,
                    location: `${project.city}, ${project.country}`,
                    priceLabel: `From ${formatMarketPrice(project.priceFrom, "sale", project.currency)}`,
                    description: project.description,
                    amenities: project.amenities,
                    highlights: [
                      { label: "Completion", value: project.completion },
                      { label: "Status", value: project.status.replace("-", " ") },
                      { label: "Rental yield", value: `${project.rentalYield}%` },
                      { label: "5-yr appreciation", value: `+${project.appreciation5yr}%` },
                    ],
                    paymentPlan: [
                      { label: `Booking deposit`, value: `${project.downPaymentPct}%` },
                      { label: `During construction`, value: `${project.duringConstructionPct}%` },
                      { label: `On handover`, value: `${project.handoverPct}%` },
                    ],
                  }}
                />
                <Button variant="outline" className="w-full">
                  Book a viewing
                </Button>
              </div>
              <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
                Developed by <span className="font-medium text-foreground">{project.developer}</span>.
                Branded proposals generate in multiple languages &amp; currencies.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
