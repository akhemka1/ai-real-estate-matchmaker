"use client";

import { Minus, Plus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatPercent } from "@/lib/utils";
import type { MatchReason } from "@/types";

interface ExplainabilityPanelProps {
  reasons: MatchReason[];
  title?: string;
  className?: string;
}

const sentimentConfig = {
  positive: {
    icon: TrendingUp,
    badge: "success" as const,
    indicator: "bg-success",
  },
  neutral: {
    icon: Minus,
    badge: "secondary" as const,
    indicator: "bg-muted-foreground",
  },
  negative: {
    icon: TrendingDown,
    badge: "warning" as const,
    indicator: "bg-warning",
  },
};

export function ExplainabilityPanel({
  reasons,
  title = "Why this match",
  className,
}: ExplainabilityPanelProps) {
  if (reasons.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reasons.map((reason) => {
          const config = sentimentConfig[reason.sentiment];
          const Icon = config.icon;
          const weightPercent = reason.weight * 100;

          return (
            <div key={reason.factor} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{reason.factor}</span>
                </div>
                <Badge variant={config.badge} className="shrink-0">
                  {formatPercent(weightPercent, 0)} weight
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{reason.description}</p>
              <Progress
                value={weightPercent}
                indicatorClassName={cn(config.indicator)}
                className="h-1.5"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
