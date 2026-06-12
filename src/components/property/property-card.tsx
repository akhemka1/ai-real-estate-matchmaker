"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, Bed, GitCompare, Heart, MapPin, Maximize2 } from "lucide-react";

import { MatchScoreBadge } from "@/components/ai/match-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCompareStore } from "@/stores/compare-store";
import { useSavedStore } from "@/stores/saved-store";
import { cn, formatNumber, formatMarketPrice } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  layout?: "grid" | "list";
  matchScore?: number;
  confidence?: number;
  className?: string;
}

export function PropertyCard({
  property,
  layout = "grid",
  matchScore,
  confidence,
  className,
}: PropertyCardProps) {
  const { toggle, isSaved } = useSavedStore();
  const { add, remove, isInCompare } = useCompareStore();
  const saved = isSaved(property.id);
  const inCompare = isInCompare(property.id);
  const image = property.images[0];

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) remove(property.id);
    else add(property.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(property.id);
  };

  const ActionButtons = (
    <div className="absolute right-2.5 top-2.5 flex gap-1.5">
      <button
        onClick={handleSave}
        aria-label={saved ? "Remove from saved" : "Save property"}
        className="glass inline-flex size-9 items-center justify-center rounded-full text-foreground transition-transform hover:scale-110"
      >
        <Heart className={cn("size-4", saved && "fill-destructive text-destructive")} />
      </button>
      <button
        onClick={handleCompare}
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        className="glass inline-flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110"
      >
        <GitCompare className={cn("size-4", inCompare && "text-primary")} />
      </button>
    </div>
  );

  const TopBadges = (
    <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
      <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize">
        {property.status.replace("_", " ")}
      </span>
      <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize">
        {property.propertyType}
      </span>
    </div>
  );

  if (layout === "list") {
    return (
      <Card
        className={cn(
          "group overflow-hidden rounded-2xl transition-all duration-300 ease-premium hover:shadow-card-hover",
          className
        )}
      >
        <Link href={`/properties/${property.id}`} className="flex flex-col sm:flex-row">
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted sm:w-64">
            {image && (
              <Image
                src={image}
                alt={property.title}
                fill
                className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                sizes="256px"
              />
            )}
            {TopBadges}
            {ActionButtons}
            {matchScore != null && (
              <div className="absolute bottom-2.5 left-2.5">
                <MatchScoreBadge score={matchScore} confidence={confidence} />
              </div>
            )}
          </div>
          <CardContent className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{property.title}</h3>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {property.address.country}
                </Badge>
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" />
                {property.address.street}, {property.address.city}, {property.address.country}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="size-3.5" /> {property.bedrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="size-3.5" /> {property.bathrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Maximize2 className="size-3.5" /> {formatNumber(property.sqft)} sqft
                </span>
              </div>
            </div>
            <p className="mt-3 text-xl font-bold tracking-tight">
              {formatMarketPrice(property.price, property.listingType, property.currency)}
            </p>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-2xl border-border/70 transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      <Link href={`/properties/${property.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image && (
            <Image
              src={image}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-[600ms] ease-premium group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {TopBadges}
          {ActionButtons}
          {matchScore != null && (
            <div className="absolute bottom-2.5 left-2.5">
              <MatchScoreBadge score={matchScore} confidence={confidence} />
            </div>
          )}
        </div>
        <CardContent className="space-y-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold tracking-tight">
              {formatMarketPrice(property.price, property.listingType, property.currency)}
            </p>
            <Badge variant="secondary" className="capitalize">
              {property.address.country}
            </Badge>
          </div>
          <h3 className="line-clamp-1 font-semibold">{property.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="line-clamp-1">
              {property.address.city}, {property.address.state}, {property.address.country}
            </span>
          </p>
          <div className="flex gap-3 pt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="size-3.5" /> {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" /> {property.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" /> {formatNumber(property.sqft)}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
