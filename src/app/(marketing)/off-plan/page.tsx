import { Building2, Sparkles } from "lucide-react";

import { ProjectCard } from "@/components/offplan/project-card";
import { mockProjects } from "@/lib/mock-data";

export const metadata = {
  title: "Off-Plan Projects",
  description:
    "Discover off-plan developments from top developers with flexible payment plans and AI investment insights.",
};

export default function OffPlanPage() {
  const totalUnits = mockProjects.reduce(
    (sum, p) => sum + p.unitTypes.reduce((u, t) => u + t.available, 0),
    0
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-mesh-gradient" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
            <Building2 className="h-4 w-4 text-ai" />
            Off-Plan Marketplace
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Invest early. <span className="text-gradient">Maximise returns.</span>
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Explore launch-phase developments from leading developers with flexible payment
            plans, AI-modelled installment schedules, and transparent yield &amp; appreciation
            forecasts.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { value: `${mockProjects.length}`, label: "live developments" },
            { value: `${totalUnits}+`, label: "available units" },
            { value: "AI", label: "payment-plan modelling" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card/80 p-4 shadow-card backdrop-blur">
              <p className="flex items-center gap-1.5 text-2xl font-bold text-primary">
                {s.value === "AI" ? <Sparkles className="h-5 w-5 text-ai" /> : null}
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
