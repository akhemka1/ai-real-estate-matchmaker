"use client";

import { Progress } from "@/components/ui/progress";
import { cn, formatPercent } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function getConfidenceColor(value: number) {
  if (value >= 80) return "bg-success";
  if (value >= 60) return "bg-ai";
  if (value >= 40) return "bg-warning";
  return "bg-destructive";
}

export function ConfidenceMeter({
  value,
  label = "Confidence",
  showValue = true,
  className,
}: ConfidenceMeterProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {showValue && (
          <span className="font-medium">{formatPercent(clamped, 0)}</span>
        )}
      </div>
      <Progress
        value={clamped}
        indicatorClassName={getConfidenceColor(clamped)}
        className="h-2"
      />
    </div>
  );
}
