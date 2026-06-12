"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedStore } from "@/stores/saved-store";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

export default function SavedPage() {
  const savedIds = useSavedStore((s) => s.savedIds);
  const toggle = useSavedStore((s) => s.toggle);
  const savedProperties = mockProperties.filter((p) => savedIds.includes(p.id));

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Saved Properties</h1>
            <p className="text-muted-foreground">
              {savedProperties.length} saved listing
              {savedProperties.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {savedProperties.length === 0 ? (
          <div className="mt-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No saved properties yet</p>
            <Link href="/properties" className="mt-4 inline-block">
              <Button>Browse properties</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedProperties.map((property) => (
              <div
                key={property.id}
                className="overflow-hidden rounded-lg border bg-card shadow-card"
              >
                <Link href={`/properties/${property.id}`}>
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </Link>
                <div className="p-4">
                  <p className="text-lg font-semibold text-primary">
                    {formatMarketPrice(property.price, property.listingType, property.currency)}
                  </p>
                  <h2 className="font-medium">{property.title}</h2>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggle(property.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
