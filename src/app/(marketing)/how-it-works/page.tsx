import Link from "next/link";
import { Search, Brain, Home, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Tell us what you want",
    description:
      "Describe your ideal home in plain English or set preferences for budget, location, and lifestyle.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI analyzes & matches",
    description:
      "Our engine scores every listing against your criteria with transparent, explainable factors.",
  },
  {
    icon: Home,
    step: "03",
    title: "Explore top matches",
    description:
      "Browse ranked recommendations with match scores, price intelligence, and detailed insights.",
  },
  {
    icon: Handshake,
    step: "04",
    title: "Connect & close",
    description:
      "Message agents, schedule tours, and make confident decisions with AI-backed data.",
  },
];

export const metadata = {
  title: "How It Works",
};

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">How {siteConfig.name} Works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          From search to keys in hand — powered by intelligent matchmaking.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-5xl space-y-12">
        {steps.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className={`flex flex-col items-center gap-8 md:flex-row ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-ai/10">
                <Icon className="h-12 w-12 text-ai" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-sm font-bold text-ai">Step {item.step}</span>
                <h2 className="mt-1 text-2xl font-bold">{item.title}</h2>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link href="/auth/signup">
          <Button variant="ai" size="lg">
            Get started free
          </Button>
        </Link>
      </div>
    </div>
  );
}
