"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { api, isBackendConfigured } from "@/lib/api";
import { cn } from "@/lib/utils";

type State =
  | { kind: "loading" }
  | { kind: "disconnected" }
  | { kind: "live"; model: string }
  | { kind: "heuristic" };

export function AiStatusBadge({ className }: { className?: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!isBackendConfigured()) {
      setState({ kind: "disconnected" });
      return;
    }
    let active = true;
    api
      .aiStatus()
      .then((s) => {
        if (!active) return;
        setState(
          s.llm_enabled ? { kind: "live", model: s.model ?? "claude" } : { kind: "heuristic" }
        );
      })
      .catch(() => active && setState({ kind: "disconnected" }));
    return () => {
      active = false;
    };
  }, []);

  const dot = "inline-block h-1.5 w-1.5 rounded-full";
  if (state.kind === "loading") return null;

  if (state.kind === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ai/30 bg-ai/10 px-2.5 py-1 text-[11px] font-semibold text-ai",
          className
        )}
        title={`Claude is live: ${state.model}`}
      >
        <Sparkles className="h-3 w-3" />
        AI live · {state.model}
      </span>
    );
  }

  const label = state.kind === "heuristic" ? "AI: heuristic mode" : "AI: backend offline";
  const color = state.kind === "heuristic" ? "bg-warning" : "bg-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground",
        className
      )}
      title={
        state.kind === "heuristic"
          ? "Backend reachable, but no ANTHROPIC_API_KEY — using heuristic fallback."
          : "Set NEXT_PUBLIC_API_BASE_URL and start the backend to enable AI."
      }
    >
      <span className={cn(dot, color)} />
      {label}
    </span>
  );
}
