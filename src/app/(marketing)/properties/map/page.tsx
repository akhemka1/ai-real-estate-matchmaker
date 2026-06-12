import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProperties } from "@/lib/mock-data";

export const metadata = {
  title: "Property Map",
};

// Equirectangular world map (keyless, stable). Because it is an equirectangular
// projection, latitude/longitude map linearly to x/y, so markers land on the
// correct geographic location.
const WORLD_MAP_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1280px-Equirectangular_projection_SW.jpg";

function geoToPercent(lat: number, lng: number) {
  return {
    left: ((lng + 180) / 360) * 100,
    top: ((90 - lat) / 180) * 100,
  };
}

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

        <h1 className="text-2xl font-bold">Property Map</h1>
        <p className="text-muted-foreground">
          {mockProperties.length} curated listings plotted across global markets
        </p>

        <div className="relative mt-8 overflow-hidden rounded-3xl border bg-muted/30">
          <div className="absolute inset-0 bg-mesh-gradient" />
          <div className="relative grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            {/* World-map panel: real map image in the background, geo-accurate pins on top */}
            <div
              className="relative min-h-[420px] overflow-hidden rounded-2xl border bg-slate-800 bg-cover bg-center shadow-card"
              style={{ backgroundImage: `url("${WORLD_MAP_URL}")` }}
            >
              {/* Contrast overlay so the colored pins pop against the map */}
              <div className="absolute inset-0 bg-slate-950/35" />

              <div className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
                Global property map
              </div>

              {mockProperties.map((property) => {
                const { left, top } = geoToPercent(
                  property.address.lat,
                  property.address.lng
                );

                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={`${property.title} — ${property.address.city}`}
                  >
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-md ring-2 ring-background/70 transition-transform group-hover:scale-110">
                      <MapPin className="h-3 w-3" />
                      {property.address.country}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-2xl border bg-background p-5 shadow-card">
              <h2 className="text-lg font-semibold">Market snapshot</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tap any pin on the map to open the property detail page.
              </p>
              <ul className="mt-4 space-y-3">
                {mockProperties.map((property) => (
                  <li key={property.id}>
                    <Link
                      href={`/properties/${property.id}`}
                      className="flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{property.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {property.address.city}, {property.address.state}, {property.address.country}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
