import Image from "next/image";
import Link from "next/link";
import { Building2, CalendarClock, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatMarketPrice } from "@/lib/utils";
import type { OffPlanProject } from "@/types";

const statusLabel: Record<OffPlanProject["status"], string> = {
  "pre-launch": "Pre-launch",
  selling: "Selling",
  "under-construction": "Under construction",
  ready: "Ready to move",
};

export function ProjectCard({ project }: { project: OffPlanProject }) {
  return (
    <Link
      href={`/off-plan/${project.id}`}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image
          src={project.images[0]}
          alt={project.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[600ms] ease-premium group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          {statusLabel[project.status]}
        </span>
        <span className="glass absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          {project.paymentPlanLabel === "Ready" ? "Ready" : `${project.paymentPlanLabel} plan`}
        </span>
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-xs font-medium opacity-90">From</p>
          <p className="text-lg font-bold tracking-tight">
            {formatMarketPrice(project.priceFrom, "sale", project.currency)}
          </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold leading-tight">{project.name}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> {project.developer} · {project.city}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary" className="gap-1">
            <CalendarClock className="h-3 w-3" /> {project.completion}
          </Badge>
          <Badge variant="secondary" className="gap-1 text-success">
            <TrendingUp className="h-3 w-3" /> {project.rentalYield}% yield
          </Badge>
        </div>
      </div>
    </Link>
  );
}
