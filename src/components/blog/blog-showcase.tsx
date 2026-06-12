import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Sparkles, BookOpenText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const posts = [
  {
    id: "market-intelligence",
    category: "Market",
    title: "How AI pricing helps buyers trust the market again",
    excerpt: "Explain pricing, demand, and appreciation in one view buyers can understand fast.",
    date: "Jun 9, 2026",
    readTime: "6 min read",
  },
  {
    id: "cross-border-buyers",
    category: "Global",
    title: "Selling to India, USA, and Canada from the same product",
    excerpt: "One product can support multiple markets if currency, language, and workflows are intentional.",
    date: "Jun 3, 2026",
    readTime: "5 min read",
  },
  {
    id: "ai-match-scoring",
    category: "AI",
    title: "What a good property match score looks like in production",
    excerpt: "Move beyond vanity scores with clear criteria, fallback logic, and trust signals.",
    date: "May 28, 2026",
    readTime: "4 min read",
  },
  {
    id: "ux-for-listings",
    category: "UX",
    title: "Why real estate UI needs to read in under ten seconds",
    excerpt: "If the page takes effort to decode, the lead is already cold.",
    date: "May 21, 2026",
    readTime: "3 min read",
  },
];

export function BlogShowcase() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-ai/10 px-4 py-1.5 text-sm font-medium text-ai">
              <Sparkles className="h-4 w-4" />
              Insights for selling real estate software
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Read the blog in seconds, not minutes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                The layout uses short titles, stronger contrast, and wider spacing so the page is
                readable at a glance while still feeling like a premium product.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <CardHeader className="space-y-4 pb-4">
                    <Badge variant="ai" className="w-fit">
                      {post.category}
                    </Badge>
                    <CardTitle className="text-2xl leading-tight">{post.title}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-muted-foreground">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {post.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-none bg-gradient-to-br from-ai/10 via-background to-secondary/40 shadow-card">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpenText className="h-4 w-4 text-ai" />
                What readers should learn
              </div>
              <Badge variant="secondary" className="w-fit">Editorial strategy</Badge>
              <CardTitle className="text-3xl leading-tight">Make the blog support sales conversations.</CardTitle>
              <CardDescription className="text-base leading-7">
                Keep the writing short, clear, and market-aware so every article reinforces trust,
                global reach, and the product&apos;s value to buyers, sellers, brokers, and agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Use short paragraphs and strong section titles.",
                "Add local examples from India, the US, Canada, and the UAE.",
                "Link every article back into search, recommendations, or signup.",
              ].map((item) => (
                <div key={item} className="rounded-xl border bg-background p-4 text-sm leading-6 text-foreground">
                  {item}
                </div>
              ))}
              <Link href="/properties">
                <Button variant="ai" className="mt-2 w-full">
                  Explore the product
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}