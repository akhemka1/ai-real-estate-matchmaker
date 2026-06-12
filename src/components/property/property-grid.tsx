"use client";

import { LayoutGrid, List } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Property, Recommendation } from "@/types";

interface PropertyGridProps {
  properties: Property[];
  recommendations?: Recommendation[];
  layout?: "grid" | "list";
  onLayoutChange?: (layout: "grid" | "list") => void;
  className?: string;
}

export function PropertyGrid({
  properties,
  recommendations,
  layout = "grid",
  onLayoutChange,
  className,
}: PropertyGridProps) {
  const recMap = new Map(
    recommendations?.map((r) => [r.propertyId, r]) ?? []
  );

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No properties found"
        description="Try adjusting your filters or search query."
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {onLayoutChange && (
        <div className="flex justify-end gap-1">
          <Button
            variant={layout === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => onLayoutChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={layout === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => onLayoutChange("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          layout === "grid"
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-4"
        )}
      >
        {properties.map((property) => {
          const rec = recMap.get(property.id);
          return (
            <PropertyCard
              key={property.id}
              property={property}
              layout={layout}
              matchScore={rec?.matchScore}
              confidence={rec?.confidence}
            />
          );
        })}
      </div>
    </div>
  );
}
