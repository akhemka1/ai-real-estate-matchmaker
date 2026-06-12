"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/stores/filter-store";
import { cn } from "@/lib/utils";

interface NaturalLanguageSearchProps {
  variant?: "hero" | "compact";
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function NaturalLanguageSearch({
  variant = "hero",
  placeholder = "Describe your dream home — e.g. 3 bed near good schools under $500K",
  className,
  onSearch,
}: NaturalLanguageSearchProps) {
  const { filters, setFilter } = useFilterStore();
  const [query, setQuery] = useState(filters.query ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setFilter("query", trimmed || undefined);
    onSearch?.(trimmed);
  };

  if (variant === "compact") {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn("flex items-center gap-2", className)}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="ai" size="icon">
          <Sparkles className="size-4" />
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative mx-auto w-full max-w-2xl rounded-2xl border bg-card p-2 shadow-card",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ai" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-12 border-0 bg-transparent pl-12 text-base shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" variant="ai" size="lg" className="shrink-0">
          <Search className="size-4" />
          Search with AI
        </Button>
      </div>
      <p className="px-4 pb-2 text-xs text-muted-foreground">
        Try natural language — our AI understands location, budget, and lifestyle
      </p>
    </form>
  );
}
