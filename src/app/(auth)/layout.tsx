import Link from "next/link";
import { CheckCircle2, Globe2, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--ai-muted))_0%,transparent_42%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted))/0.2)] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <Sparkles className="h-5 w-5" />
            {siteConfig.name}
          </Link>
          <h1 className="mt-8 max-w-xl text-4xl font-bold tracking-tight xl:text-5xl">
            Built for teams that sell property experiences at scale.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground">
            Sign in to manage AI matches, saved listings, and team workflows across India,
            North America, and global markets.
          </p>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            {[
              "Explainable ranking and price intelligence",
              "Buyer, seller, and agent workspaces",
              "Designed for multiple markets and teams",
              "Fast search with a clean, premium UI",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border bg-card/80 p-4 shadow-card backdrop-blur">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ai" />
                <p className="text-sm leading-6 text-foreground">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {siteConfig.markets?.map((market) => (
              <span key={market} className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Globe2 className="h-3.5 w-3.5" />
                {market}
              </span>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-primary">
              <Sparkles className="h-5 w-5" />
              {siteConfig.name}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage AI matches and property workflows.
            </p>
          </div>
          {children}
          <Link href="/how-it-works" className="mt-6 block">
            <Button variant="ghost" className="w-full">
              See how the platform works
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
