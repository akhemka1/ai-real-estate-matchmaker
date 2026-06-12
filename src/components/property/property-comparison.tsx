"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

import { PricePredictionWidget } from "@/components/ai/price-prediction-widget";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/compare-store";
import { cn, formatNumber, formatMarketPrice } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyComparisonProps {
  properties: Property[];
  className?: string;
}

const rows: {
  label: string;
  getValue: (p: Property) => ReactNode;
}[] = [
  {
    label: "Price",
    getValue: (p) => formatMarketPrice(p.price, p.listingType, p.currency),
  },
  {
    label: "Bedrooms",
    getValue: (p) => p.bedrooms,
  },
  {
    label: "Bathrooms",
    getValue: (p) => p.bathrooms,
  },
  {
    label: "Sqft",
    getValue: (p) => formatNumber(p.sqft),
  },
  {
    label: "Type",
    getValue: (p) => <span className="capitalize">{p.propertyType}</span>,
  },
  {
    label: "Year built",
    getValue: (p) => p.yearBuilt ?? "—",
  },
  {
    label: "Location",
    getValue: (p) => `${p.address.city}, ${p.address.state}`,
  },
];

export function PropertyComparison({
  properties,
  className,
}: PropertyComparisonProps) {
  const { remove, clear } = useCompareStore();

  if (properties.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Add properties to compare side by side.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Comparing {properties.length} properties
        </h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Feature</th>
              {properties.map((property) => (
                <th key={property.id} className="min-w-[180px] p-3 text-left">
                  <div className="space-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                      {property.images[0] && (
                        <Image
                          src={property.images[0]}
                          alt={property.title}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      )}
                    </div>
                    <Link
                      href={`/properties/${property.id}`}
                      className="line-clamp-2 font-medium hover:text-primary"
                    >
                      {property.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => remove(property.id)}
                    >
                      <X className="mr-1 size-3" />
                      Remove
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-0">
                <td className="p-3 font-medium text-muted-foreground">
                  {row.label}
                </td>
                {properties.map((property) => (
                  <td key={property.id} className="p-3">
                    {row.getValue(property)}
                  </td>
                ))}
              </tr>
            ))}
            {properties.some((p) => p.aiPriceEstimate != null) && (
              <tr className="border-b">
                <td className="p-3 align-top font-medium text-muted-foreground">
                  AI estimate
                </td>
                {properties.map((property) => (
                  <td key={property.id} className="p-3 align-top">
                    {property.aiPriceEstimate != null ? (
                      <PricePredictionWidget property={property} />
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
