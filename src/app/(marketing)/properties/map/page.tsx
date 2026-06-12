import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMap } from "@/components/property/property-map";
import { mockProperties } from "@/lib/mock-data";

export const metadata = {
  title: "Property Map",
};

export default function PropertyMapPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <Link href="/properties">
          <Button variant="ghost" size="sm" className="mb-3">
            <ArrowLeft className="h-4 w-4" />
            List view
          </Button>
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Explore on the map</h1>
          <p className="text-muted-foreground">
            {mockProperties.length} listings across global markets — pan, zoom, and click a pin to dive in
          </p>
        </div>

        <PropertyMap />
      </div>
    </div>
  );
}
