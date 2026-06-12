"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatPercent } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  confidence?: number;
  className?: string;
}

export function MatchScoreBadge({
  score,
  confidence,
  className,
}: MatchScoreBadgeProps) {
  const badge = (
    <Badge
      variant="ai"
      className={cn("gap-1 px-2.5 py-1 text-sm font-semibold", className)}
    >
      <Sparkles className="size-3.5" />
      {formatPercent(score, 0)} match
    </Badge>
  );

  if (confidence == null) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">AI confidence: {formatPercent(confidence, 0)}</p>
          <p className="text-xs text-muted-foreground">
            Based on your preferences and market data
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
