"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/stores/filter-store";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

const propertyTypes: Property["propertyType"][] = [
  "house",
  "condo",
  "apartment",
  "townhouse",
  "land",
];

interface PropertyFiltersProps {
  className?: string;
  onApply?: () => void;
}

export function PropertyFilters({ className, onApply }: PropertyFiltersProps) {
  const { filters, setFilter, resetFilters } = useFilterStore();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
  };

  return (
    <div className={cn("space-y-4 rounded-2xl border bg-card p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4" />
          Filters
        </div>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <X className="mr-1 size-3.5" />
          Reset
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">City</label>
          <Input
            value={filters.city ?? ""}
            onChange={(e) => setFilter("city", e.target.value || undefined)}
            placeholder="Any city"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Country</label>
          <Input
            value={filters.country ?? ""}
            onChange={(e) => setFilter("country", e.target.value || undefined)}
            placeholder="Any country"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Min price</label>
          <Input
            type="number"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              setFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="No min"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Max price</label>
          <Input
            type="number"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              setFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="No max"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Bedrooms</label>
          <Input
            type="number"
            min={0}
            value={filters.bedrooms ?? ""}
            onChange={(e) =>
              setFilter("bedrooms", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="Any"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["sale", "rent"] as const).map((type) => (
          <Button
            key={type}
            variant={filters.listingType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("listingType", type)}
          >
            For {type}
          </Button>
        ))}
        {["India", "USA", "Canada", "UK"].map((country) => (
          <Button
            key={country}
            variant={filters.country === country ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("country", filters.country === country ? undefined : country)}
          >
            {country}
          </Button>
        ))}
      </div>

      <div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          Advanced filters
          {advancedOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {advancedOpen && (
          <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">State</label>
              <Input
                value={filters.state ?? ""}
                onChange={(e) => setFilter("state", e.target.value || undefined)}
                placeholder="Any state"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bathrooms</label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={filters.bathrooms ?? ""}
                onChange={(e) =>
                  setFilter(
                    "bathrooms",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Any"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min sqft</label>
              <Input
                type="number"
                value={filters.minSqft ?? ""}
                onChange={(e) =>
                  setFilter("minSqft", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="No min"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max sqft</label>
              <Input
                type="number"
                value={filters.maxSqft ?? ""}
                onChange={(e) =>
                  setFilter("maxSqft", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="No max"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Property type
              </label>
              <div className="flex flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <Button
                    key={type}
                    variant={filters.propertyType === type ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    onClick={() =>
                      setFilter(
                        "propertyType",
                        filters.propertyType === type ? undefined : type
                      )
                    }
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={handleApply}>
        Apply filters
      </Button>
    </div>
  );
}
