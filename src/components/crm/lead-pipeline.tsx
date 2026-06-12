"use client";

import { useMemo, useState } from "react";
import { Hand, Plus, Trophy, UserCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import {
  type DistributionMode,
  type Lead,
  type LeadStage,
  type NewLeadInput,
  SELF_ID,
  TEAM,
  useLeadsStore,
} from "@/stores/leads-store";

const STAGES: { key: LeadStage; label: string; dot: string }[] = [
  { key: "new", label: "New", dot: "bg-primary" },
  { key: "contacted", label: "Contacted", dot: "bg-accent" },
  { key: "qualified", label: "Qualified", dot: "bg-ai" },
  { key: "negotiation", label: "Negotiation", dot: "bg-warning" },
  { key: "won", label: "Won", dot: "bg-success" },
];

const MODES: { key: DistributionMode; label: string; hint: string }[] = [
  { key: "all", label: "All Available", hint: "New leads go to a shared pool everyone can see." },
  { key: "first", label: "First Responder", hint: "First teammate to claim a lead owns it." },
  { key: "rotation", label: "Fair Rotation", hint: "New leads are auto-assigned round-robin." },
  { key: "me", label: "Only Me", hint: "New leads are assigned to you." },
];

function teamName(id: string | null) {
  return TEAM.find((t) => t.id === id) ?? null;
}

export function LeadPipeline() {
  const { leads, mode, setMode, addLead, moveLead, assignLead, claimLead, removeLead } =
    useLeadsStore();
  const [adding, setAdding] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const byStage = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = {
      new: [], contacted: [], qualified: [], negotiation: [], won: [], lost: [],
    };
    for (const lead of leads) map[lead.stage]?.push(lead);
    return map;
  }, [leads]);

  const wonValue = byStage.won.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Pipeline</h1>
          <p className="text-muted-foreground">
            {leads.filter((l) => l.stage !== "lost").length} active leads · {byStage.lost.length} lost
          </p>
        </div>
        <Button variant="ai" onClick={() => setAdding((v) => !v)}>
          <Plus className="h-4 w-4" />
          Add lead
        </Button>
      </div>

      {/* Distribution mode */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Lead distribution</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                mode === m.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/40"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{activeMode.hint}</p>
      </div>

      {adding && <AddLeadForm onClose={() => setAdding(false)} onAdd={addLead} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total leads" value={leads.length} />
        <Stat label="Qualified+" value={byStage.qualified.length + byStage.negotiation.length} />
        <Stat label="Won" value={byStage.won.length} icon={<Trophy className="h-4 w-4 text-success" />} />
        <Stat label="Won value" value={`$${formatNumber(Math.round(wonValue))}`} />
      </div>

      {/* Board */}
      <div className="grid gap-4 lg:grid-cols-5">
        {STAGES.map((stage) => (
          <div
            key={stage.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) moveLead(dragId, stage.key);
              setDragId(null);
            }}
            className="flex flex-col rounded-2xl border bg-muted/30 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("inline-block h-2.5 w-2.5 rounded-full", stage.dot)} />
                {stage.label}
              </span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {byStage[stage.key].length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {byStage[stage.key].map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  stageKey={stage.key}
                  mode={mode}
                  onDragStart={() => setDragId(lead.id)}
                  onMove={moveLead}
                  onAssign={assignLead}
                  onClaim={claimLead}
                  onLost={() => moveLead(lead.id, "lost")}
                  onDelete={() => removeLead(lead.id)}
                />
              ))}
              {byStage[stage.key].length === 0 && (
                <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Drop leads here
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

const STAGE_ORDER: LeadStage[] = ["new", "contacted", "qualified", "negotiation", "won"];

function LeadCard({
  lead,
  stageKey,
  mode,
  onDragStart,
  onMove,
  onAssign,
  onClaim,
  onLost,
  onDelete,
}: {
  lead: Lead;
  stageKey: LeadStage;
  mode: DistributionMode;
  onDragStart: () => void;
  onMove: (id: string, stage: LeadStage) => void;
  onAssign: (id: string, agentId: string | null) => void;
  onClaim: (id: string) => void;
  onLost: () => void;
  onDelete: () => void;
}) {
  const idx = STAGE_ORDER.indexOf(stageKey);
  const owner = teamName(lead.assignedTo);
  const claimable = lead.assignedTo === null && (mode === "first" || mode === "all");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-card active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight">{lead.name}</p>
        <button
          onClick={onDelete}
          aria-label="Remove lead"
          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email}</p>

      {lead.propertyInterest && (
        <p className="mt-2 truncate text-xs">
          <span className="text-muted-foreground">Interest:</span> {lead.propertyInterest}
        </p>
      )}
      {lead.budget && <p className="text-xs text-muted-foreground">Budget: {lead.budget}</p>}

      {lead.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.map((t) => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
              {t}
            </span>
          ))}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {lead.source}
          </span>
        </div>
      )}

      {/* Owner / claim */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
        {claimable ? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onClaim(lead.id)}>
            <Hand className="h-3 w-3" /> Claim
          </Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {owner ? (
              <>
                <span className="grid size-5 place-items-center rounded-full bg-brand-gradient text-[9px] font-bold text-white">
                  {owner.initials}
                </span>
                {owner.id === SELF_ID ? "You" : owner.name}
              </>
            ) : (
              <>
                <UserCircle2 className="h-4 w-4" /> Pool
              </>
            )}
          </span>
        )}

        <select
          value={lead.assignedTo ?? ""}
          onChange={(e) => onAssign(lead.id, e.target.value || null)}
          className="rounded-md border bg-background px-1.5 py-1 text-[11px]"
          aria-label="Assign lead"
        >
          <option value="">Pool</option>
          {TEAM.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id === SELF_ID ? "You" : t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Move controls */}
      <div className="mt-2 flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 flex-1 px-1 text-xs"
          disabled={idx <= 0}
          onClick={() => onMove(lead.id, STAGE_ORDER[Math.max(0, idx - 1)])}
        >
          ←
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 flex-1 px-1 text-xs"
          disabled={idx >= STAGE_ORDER.length - 1}
          onClick={() => onMove(lead.id, STAGE_ORDER[Math.min(STAGE_ORDER.length - 1, idx + 1)])}
        >
          →
        </Button>
        {stageKey !== "won" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onLost}
          >
            Lost
          </Button>
        )}
      </div>
    </div>
  );
}

function AddLeadForm({ onClose, onAdd }: { onClose: () => void; onAdd: (l: NewLeadInput) => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Website",
    budget: "",
    propertyInterest: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onAdd({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      source: form.source,
      budget: form.budget || undefined,
      propertyInterest: form.propertyInterest || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">New lead</p>
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input placeholder="Full name *" value={form.name} onChange={set("name")} />
        <Input placeholder="Email *" type="email" value={form.email} onChange={set("email")} />
        <Input placeholder="Phone" value={form.phone} onChange={set("phone")} />
        <Input placeholder="Budget (e.g. $600K–$900K)" value={form.budget} onChange={set("budget")} />
        <Input placeholder="Property interest" value={form.propertyInterest} onChange={set("propertyInterest")} />
        <select
          value={form.source}
          onChange={set("source")}
          className="flex h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm"
        >
          {["Website", "Bayut", "Property Finder", "Dubizzle", "Facebook", "Google Ads", "Referral", "WhatsApp"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="ai">
          Add &amp; auto-assign
        </Button>
      </div>
    </form>
  );
}
