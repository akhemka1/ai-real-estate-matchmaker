import Link from "next/link";
import { Plus, Eye, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProperties } from "@/lib/mock-data";
import { formatMarketPrice } from "@/lib/utils";

export const metadata = {
  title: "Listings",
};

export default function AgentListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-muted-foreground">
            Properties you represent across your portfolio
          </p>
        </div>
        <Button variant="ai">
          <Plus className="h-4 w-4" />
          Add listing
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">Property</th>
              <th className="p-4 text-left text-sm font-medium">Price</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-left text-sm font-medium">Interested</th>
              <th className="p-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockProperties.map((property, i) => (
              <tr key={property.id}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="h-12 w-16 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.address.city}, {property.address.state}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">
                  {formatMarketPrice(property.price, property.listingType, property.currency)}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium capitalize text-success">
                    {property.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-sm text-ai">
                    <Sparkles className="h-3.5 w-3.5" />
                    {[6, 3, 4][i] ?? 2} clients
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/properties/${property.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
