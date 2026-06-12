import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatPrice } from "@/lib/utils";

type Deal = {
  id: string;
  property: string;
  client: string;
  salePrice: number;
  rate: number;
  status: "paid" | "pending" | "closing";
};

const deals: Deal[] = [
  {
    id: "d1",
    property: "Modern Craftsman with Mountain Views",
    client: "Alex Rivera",
    salePrice: 720000,
    rate: 2.5,
    status: "paid",
  },
  {
    id: "d2",
    property: "Downtown Luxury Condo",
    client: "Sarah Chen",
    salePrice: 425000,
    rate: 2.5,
    status: "pending",
  },
  {
    id: "d3",
    property: "Pine Ridge Family Home",
    client: "Mike Torres",
    salePrice: 980000,
    rate: 3.0,
    status: "closing",
  },
];

const statusStyles: Record<Deal["status"], string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  closing: "bg-ai/10 text-ai",
};

const commission = (deal: Deal) => Math.round((deal.salePrice * deal.rate) / 100);

export const metadata = {
  title: "Commissions",
};

export default function AgentCommissionsPage() {
  const total = deals.reduce((sum, d) => sum + commission(d), 0);
  const paid = deals
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + commission(d), 0);
  const pending = total - paid;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">
          Track earnings across your active and closed deals
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Commission"
          value={formatPrice(total)}
          icon={DollarSign}
        />
        <StatCard title="Paid" value={formatPrice(paid)} icon={CheckCircle2} variant="accent" />
        <StatCard title="Pending" value={formatPrice(pending)} icon={Clock} variant="ai" />
        <StatCard
          title="Avg. Rate"
          value="2.7%"
          icon={TrendingUp}
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">Property</th>
              <th className="p-4 text-left text-sm font-medium">Client</th>
              <th className="p-4 text-left text-sm font-medium">Sale Price</th>
              <th className="p-4 text-left text-sm font-medium">Rate</th>
              <th className="p-4 text-left text-sm font-medium">Commission</th>
              <th className="p-4 text-right text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deals.map((deal) => (
              <tr key={deal.id}>
                <td className="p-4">
                  <p className="font-medium">{deal.property}</p>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{deal.client}</td>
                <td className="p-4 text-sm">{formatPrice(deal.salePrice)}</td>
                <td className="p-4 text-sm text-muted-foreground">{deal.rate}%</td>
                <td className="p-4 text-sm font-semibold">
                  {formatPrice(commission(deal))}
                </td>
                <td className="p-4 text-right">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[deal.status]}`}
                  >
                    {deal.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
