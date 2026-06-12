"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";

import { ExplainabilityPanel } from "@/components/ai/explainability-panel";
import { MatchScoreBadge } from "@/components/ai/match-score-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn, formatNumber, formatMarketPrice } from "@/lib/utils";
import type { Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  className,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { property, matchScore, confidence, reasons, rank } = recommendation;
  const image = property.images[0];

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-2xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {image && (
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-[600ms] ease-premium group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="glass rounded-full px-2.5 py-0.5 text-xs font-bold">
            #{rank}
          </span>
          <MatchScoreBadge score={matchScore} confidence={confidence} />
        </div>
      </div>

      <CardHeader className="pb-2">
        <Link
          href={`/properties/${property.id}`}
          className="text-lg font-semibold hover:text-primary"
        >
          {property.title}
        </Link>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {property.address.city}, {property.address.state}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2">
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-bold">
            {formatMarketPrice(property.price, property.listingType, property.currency)}
          </p>
          <p className="text-sm text-muted-foreground">
            {property.bedrooms} bd · {property.bathrooms} ba ·{" "}
            {formatNumber(property.sqft)} sqft
          </p>
        </div>

        {expanded && (
          <ExplainabilityPanel
            reasons={reasons}
            title="Why we recommend this"
            className="border-0 shadow-none"
          />
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button variant="default" className="flex-1" asChild>
          <Link href={`/properties/${property.id}`}>View details</Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide match reasons" : "Show match reasons"}
        >
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
