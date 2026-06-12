"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";
import type { ImageTag } from "@/types";

interface ImageInsightsProps {
  tags: ImageTag[];
  className?: string;
}

const categoryLabels: Record<ImageTag["category"], string> = {
  room: "Rooms",
  feature: "Features",
  condition: "Condition",
  style: "Style",
};

export function ImageInsights({ tags, className }: ImageInsightsProps) {
  if (tags.length === 0) return null;

  const grouped = tags.reduce<Record<ImageTag["category"], ImageTag[]>>(
    (acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag);
      return acc;
    },
    {} as Record<ImageTag["category"], ImageTag[]>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-ai" />
          AI Image Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(grouped) as ImageTag["category"][]).map((category) => (
          <div key={category}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {categoryLabels[category]}
            </p>
            <div className="flex flex-wrap gap-2">
              {grouped[category].map((tag) => (
                <Badge
                  key={tag.label}
                  variant="ai"
                  className={cn(
                    "gap-1",
                    tag.confidence < 0.7 && "opacity-70"
                  )}
                >
                  {tag.label}
                  <span className="text-[10px] opacity-80">
                    {formatPercent(tag.confidence * 100, 0)}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
