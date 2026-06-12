import { Mail, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockUser } from "@/lib/mock-data";

const mockClients = [
  {
    ...mockUser,
    budget: "$600K – $900K",
    status: "active" as const,
    matches: 3,
  },
  {
    id: "u2",
    email: "sarah@example.com",
    firstName: "Sarah",
    lastName: "Chen",
    role: "buyer" as const,
    budget: "$400K – $500K",
    status: "active" as const,
    matches: 2,
    createdAt: "2025-03-10",
  },
  {
    id: "u3",
    email: "mike@example.com",
    firstName: "Mike",
    lastName: "Torres",
    role: "buyer" as const,
    budget: "$1M+",
    status: "pending" as const,
    matches: 5,
    createdAt: "2025-04-22",
  },
];

export const metadata = {
  title: "Clients",
};

export default function AgentClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            {mockClients.length} clients in your portfolio
          </p>
        </div>
        <Button variant="ai">Add client</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockClients.map((client) => (
          <div
            key={client.id}
            className="rounded-lg border bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {client.firstName.charAt(0)}
                {client.lastName.charAt(0)}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  client.status === "active"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {client.status}
              </span>
            </div>

            <h2 className="mt-4 font-semibold">
              {client.firstName} {client.lastName}
            </h2>
            <p className="text-sm capitalize text-muted-foreground">
              {client.role} · Budget: {client.budget}
            </p>

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </span>
              {"phone" in client && client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="flex items-center gap-1 text-sm text-ai">
                <Sparkles className="h-3.5 w-3.5" />
                {client.matches} matches
              </span>
              <Button variant="outline" size="sm">
                View profile
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
