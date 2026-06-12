"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/ai/confidence-meter";
import { formatPercent } from "@/lib/utils";
import type { AppreciationForecast } from "@/types";

interface AppreciationForecastChartProps {
  forecast: AppreciationForecast;
  className?: string;
}

export function AppreciationForecastChart({
  forecast,
  className,
}: AppreciationForecastChartProps) {
  const data = [
    { period: "1 yr", value: forecast.year1 },
    { period: "3 yr", value: forecast.year3 },
    { period: "5 yr", value: forecast.year5 },
    { period: "10 yr", value: forecast.year10 },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Appreciation Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatPercent(value, 1), "Growth"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                }}
              />
              <Bar
                dataKey="value"
                fill="hsl(var(--ai))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ConfidenceMeter value={forecast.confidence} label="Forecast confidence" />
      </CardContent>
    </Card>
  );
}
