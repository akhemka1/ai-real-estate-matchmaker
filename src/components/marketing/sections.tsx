import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  Languages,
  MapPinned,
  MessageSquare,
  Route,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { ProjectCard } from "@/components/offplan/project-card";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";

/* ---------- Social-proof stats band ---------- */
export function StatsBand() {
  const stats = [
    { value: "9,000+", label: "Agents & brokers" },
    { value: "2,000+", label: "Off-plan units" },
    { value: "5", label: "Global markets" },
    { value: "94%", label: "Avg. match confidence" },
  ];
  return (
    <section className="border-y bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Off-plan teaser ---------- */
export function OffPlanTeaser() {
  const featured = mockProjects.slice(0, 3);
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-ai" /> Off-Plan Marketplace
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Launch-phase projects, AI-priced</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Flexible payment plans, live unit availability, and modelled installment schedules —
              the highest-upside way to invest.
            </p>
          </div>
          <Link href="/off-plan">
            <Button variant="ghost" className="gap-2">
              Explore projects <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Platform capabilities (CRM, distribution, calendar, PDF, location, i18n) ---------- */
export function PlatformCapabilities() {
  const caps = [
    { icon: UsersRound, title: "Smart Lead Management", desc: "Capture, tag, dedupe, and track every lead from first touch to closed deal." },
    { icon: Route, title: "Lead Distribution", desc: "All Available, First Responder, Fair Rotation, or manual — route leads automatically." },
    { icon: CalendarDays, title: "Calendar & Reminders", desc: "Day/week/month views, color-coded status, and never-miss follow-up reminders." },
    { icon: FileText, title: "Branded Proposals", desc: "Generate customised PDF proposals & quotations in multiple languages and currencies." },
    { icon: MapPinned, title: "Location Intelligence", desc: "Nearby landmarks, schools, and transport links surfaced for every listing." },
    { icon: Languages, title: "Multi-language", desc: "Full English & Arabic support, built for cross-border teams." },
  ];
  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">One platform to run the whole brokerage</h2>
          <p className="mt-3 text-muted-foreground">
            Everything a modern agency needs — CRM, team workflows, and AI — in a single product.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {caps.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border bg-card p-6 shadow-card transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ai/10 text-ai">
                <c.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Integrations ---------- */
export function IntegrationsStrip() {
  const integrations = [
    "Bayut",
    "Property Finder",
    "Dubizzle",
    "Zapier",
    "Google Ads",
    "Facebook",
    "WhatsApp",
    "WordPress",
  ];
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Connects with your stack
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {integrations.map((name) => (
            <span
              key={name}
              className="rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary/40"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
export function Testimonials() {
  const reviews = [
    { name: "Aisha Rahman", role: "Director, Skyline Realty (Dubai)", quote: "We doubled qualified leads in a quarter. The off-plan payment modelling closes investors on the first call." },
    { name: "Daniel Okafor", role: "Broker, Meridian Homes", quote: "The AI matchmaker is uncanny — clients feel understood, and the explainable scores build instant trust." },
    { name: "Priya Nair", role: "Sales Head, Prestige Partners", quote: "Lead distribution and the team calendar replaced three tools. Onboarding new agents takes minutes now." },
  ];
  const grad = ["from-primary to-accent", "from-ai to-primary", "from-accent to-ai"];
  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Trusted by high-performing teams</h2>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <figure key={r.name} className="rounded-2xl border bg-card p-6 shadow-card">
              <blockquote className="text-sm leading-relaxed text-foreground">“{r.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  className={`grid size-10 place-items-center rounded-full bg-gradient-to-br ${grad[i]} text-sm font-bold text-white`}
                >
                  {r.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Final CTA ---------- */
export function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center shadow-elevated sm:p-16">
        <div className="absolute inset-0 bg-noise opacity-[0.06]" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Transform your real estate business with AI
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Lead capture, off-plan inventory, AI matchmaking, and branded proposals — in one
            platform built to scale to millions of users.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="shadow-card">
                <Sparkles className="h-4 w-4" /> Start free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <MessageSquare className="h-4 w-4" /> Book a demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
