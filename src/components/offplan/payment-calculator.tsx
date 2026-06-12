"use client";

import { useMemo, useState } from "react";
import { Calculator, Sparkles } from "lucide-react";

import { formatMarketPrice } from "@/lib/utils";

interface PaymentCalculatorProps {
  priceFrom: number;
  currency: string;
  downPaymentPct: number;
  duringConstructionPct: number;
  handoverPct: number;
}

export function PaymentCalculator({
  priceFrom,
  currency,
  downPaymentPct,
  duringConstructionPct,
  handoverPct,
}: PaymentCalculatorProps) {
  const [price, setPrice] = useState(priceFrom);
  const [installments, setInstallments] = useState(8);

  const plan = useMemo(() => {
    const deposit = (price * downPaymentPct) / 100;
    const constructionTotal = (price * duringConstructionPct) / 100;
    const handover = (price * handoverPct) / 100;
    const perInstallment = installments > 0 ? constructionTotal / installments : 0;
    return { deposit, constructionTotal, handover, perInstallment };
  }, [price, installments, downPaymentPct, duringConstructionPct, handoverPct]);

  const money = (n: number) => formatMarketPrice(Math.round(n), "sale", currency);
  const maxPrice = priceFrom * 3;

  return (
    <div className="gradient-border p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ai/10 text-ai">
          <Calculator className="h-4 w-4" />
        </span>
        <h3 className="text-lg font-semibold text-gradient">AI Payment Plan</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Adjust the unit price and we instantly model your booking-to-handover schedule.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="pc-price" className="font-medium text-muted-foreground">
              Unit price
            </label>
            <span className="font-semibold tabular-nums">{money(price)}</span>
          </div>
          <input
            id="pc-price"
            type="range"
            min={priceFrom}
            max={maxPrice}
            step={Math.max(10000, Math.round((maxPrice - priceFrom) / 100))}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="pc-inst" className="font-medium text-muted-foreground">
              Construction installments
            </label>
            <span className="font-semibold tabular-nums">{installments}</span>
          </div>
          <input
            id="pc-inst"
            type="range"
            min={1}
            max={24}
            step={1}
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
          />
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        <Row label={`Booking deposit (${downPaymentPct}%)`} value={money(plan.deposit)} accent />
        <Row
          label={`During construction (${duringConstructionPct}%)`}
          value={`${money(plan.constructionTotal)}`}
        />
        {installments > 0 && duringConstructionPct > 0 && (
          <p className="pl-1 text-xs text-muted-foreground">
            ≈ {money(plan.perInstallment)} × {installments} installments
          </p>
        )}
        <Row label={`On handover (${handoverPct}%)`} value={money(plan.handover)} />
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-lg font-bold tracking-tight">{money(price)}</span>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-ai/5 p-3 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai" />
        Indicative schedule for planning only. Final terms are set by the developer at booking.
      </p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
