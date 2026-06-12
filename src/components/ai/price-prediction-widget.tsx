"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPercent, formatMarketPrice } from "@/lib/utils";
import type { Property } from "@/types";

interface PricePredictionWidgetProps {
  property: Pick<Property, "price" | "listingType" | "aiPriceEstimate" | "currency">;
  className?: string;
}

export function PricePredictionWidget({
  property,
  className,
}: PricePredictionWidgetProps) {
  const { price, listingType, aiPriceEstimate } = property;

  if (aiPriceEstimate == null) return null;

  const diff = aiPriceEstimate - price;
  const diffPercent = (diff / price) * 100;
  const isOverpriced = diff < 0;
  const isUnderpriced = diff > 0;
  const isFair = Math.abs(diffPercent) < 2;

  const Icon = isFair ? Minus : isOverpriced ? ArrowDown : ArrowUp;
  const badgeVariant = isFair
    ? "secondary"
    : isUnderpriced
      ? "success"
      : "warning";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI Price Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Listed price</p>
            <p className="text-lg font-semibold">
              {formatMarketPrice(price, listingType, property.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">AI estimate</p>
            <p className="text-lg font-semibold text-ai">
              {formatMarketPrice(aiPriceEstimate, listingType, property.currency)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between rounded-lg border p-3",
            isFair && "bg-muted/50",
            isUnderpriced && "border-success/30 bg-success/5",
            isOverpriced && "border-warning/30 bg-warning/5"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="size-4" />
            <span className="text-sm font-medium">
              {isFair
                ? "Fair market value"
                : isUnderpriced
                  ? "Potential deal"
                  : "Above market"}
            </span>
          </div>
          <Badge variant={badgeVariant}>
            {diff >= 0 ? "+" : ""}
            {formatPercent(diffPercent, 1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
