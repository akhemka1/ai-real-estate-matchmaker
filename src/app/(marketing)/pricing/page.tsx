import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for browsing and getting AI recommendations.",
    features: [
      "AI property search",
      "Up to 10 saved listings",
      "Basic match scores",
      "Compare up to 2 properties",
    ],
    cta: "Get started",
    href: "/auth/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious buyers who want the full AI experience.",
    features: [
      "Unlimited saved listings",
      "Full explainable match breakdowns",
      "Price intelligence & forecasts",
      "Compare up to 4 properties",
      "Priority agent matching",
    ],
    cta: "Start free trial",
    href: "/auth/signup",
    highlighted: true,
  },
  {
    name: "Agent",
    price: "$49",
    period: "/month",
    description: "Tools for agents to manage clients and AI matches.",
    features: [
      "Client management dashboard",
      "AI match alerts",
      "Lead tracking & analytics",
      "Commission tracking",
      "White-label reports",
    ],
    cta: "Join as agent",
    href: "/auth/signup",
    highlighted: false,
  },
];

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free. Upgrade when you&apos;re ready to go deeper.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-8 shadow-card ${
              plan.highlighted ? "border-ai ring-2 ring-ai" : "bg-card"
            }`}
          >
            {plan.highlighted && (
              <span className="mb-4 inline-block rounded-full bg-ai px-3 py-1 text-xs font-medium text-ai-foreground">
                Most popular
              </span>
            )}
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <div className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ai" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href={plan.href} className="mt-8 block">
              <Button
                className="w-full"
                variant={plan.highlighted ? "ai" : "outline"}
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
