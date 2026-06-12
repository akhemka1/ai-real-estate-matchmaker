import Link from "next/link";
import { ArrowLeft, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMap } from "@/components/property/property-map";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

export const metadata = {
  title: "Property Map",
};

export default function PropertyMapPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            List view
          </Button>
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Property Map</h1>
            <p className="text-muted-foreground">
              {mockProperties.length} listings plotted at their real locations across global markets
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Switch Street / Satellite (top-right) · click a pin for details
          </span>
        </div>

        {/* Real interactive map (Leaflet + OpenStreetMap — keyless, accurate) */}
        <div className="mt-6">
          <PropertyMap />
        </div>

        {/* Quick list of the plotted listings */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">All listings on the map</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockProperties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors hover:bg-muted/40"
              >
                <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{property.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {property.address.city}, {property.address.state}, {property.address.country}
                  </span>
                  <span className="mt-1 block text-xs font-semibold">
                    {formatMarketPrice(property.price, property.listingType, property.currency)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
