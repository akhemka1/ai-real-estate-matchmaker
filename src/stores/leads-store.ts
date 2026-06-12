import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LeadStage = "new" | "contacted" | "qualified" | "negotiation" | "won" | "lost";

// Lead routing strategies (mirrors the industry-standard distribution modes).
export type DistributionMode = "all" | "first" | "rotation" | "me";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  stage: LeadStage;
  assignedTo: string | null; // TeamMember id, or null for the shared pool
  tags: string[];
  propertyInterest?: string;
  budget?: string;
  value?: number; // potential deal value, for the "won" pipeline total
  createdAt: string;
}

export const TEAM: TeamMember[] = [
  { id: "a1", name: "You (Jordan Lee)", initials: "JL" },
  { id: "a2", name: "Maya Patel", initials: "MP" },
  { id: "a3", name: "Sam Cohen", initials: "SC" },
  { id: "a4", name: "Ava Reyes", initials: "AR" },
];

export const SELF_ID = "a1";

export interface NewLeadInput {
  name: string;
  email: string;
  phone?: string;
  source: string;
  budget?: string;
  propertyInterest?: string;
  value?: number;
  tags?: string[];
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `l-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function assignFor(mode: DistributionMode, rotationIndex: number): {
  assignedTo: string | null;
  nextRotation: number;
} {
  switch (mode) {
    case "me":
      return { assignedTo: SELF_ID, nextRotation: rotationIndex };
    case "rotation":
      return {
        assignedTo: TEAM[rotationIndex % TEAM.length].id,
        nextRotation: (rotationIndex + 1) % TEAM.length,
      };
    case "all": // shared pool — visible to everyone, unassigned
    case "first": // first responder — claimable by anyone
    default:
      return { assignedTo: null, nextRotation: rotationIndex };
  }
}

const seedLeads: Lead[] = [
  { id: "seed-1", name: "Sarah Chen", email: "sarah@example.com", phone: "(555) 123-4567", source: "Website", stage: "new", assignedTo: null, tags: ["Hot", "Buyer"], propertyInterest: "Modern Craftsman", budget: "$600K–$900K", value: 875000, createdAt: new Date(Date.now() - 7.2e6).toISOString() },
  { id: "seed-2", name: "Mike Torres", email: "mike@example.com", source: "Property Finder", stage: "contacted", assignedTo: "a2", tags: ["Investor"], propertyInterest: "Downtown Condo", budget: "$1M+", value: 1245000, createdAt: new Date(Date.now() - 8.6e7).toISOString() },
  { id: "seed-3", name: "Lisa Park", email: "lisa@example.com", phone: "(555) 987-6543", source: "Bayut", stage: "qualified", assignedTo: "a1", tags: ["Renter"], propertyInterest: "Garden Villa", budget: "₹1.5–2 Cr", value: 18500000, createdAt: new Date(Date.now() - 1.7e8).toISOString() },
  { id: "seed-4", name: "Omar Haddad", email: "omar@example.com", phone: "(971) 50-555-1212", source: "Facebook", stage: "negotiation", assignedTo: "a3", tags: ["Off-Plan", "Hot"], propertyInterest: "Marina Skyline", budget: "AED 2–4M", value: 2450000, createdAt: new Date(Date.now() - 2.6e8).toISOString() },
  { id: "seed-5", name: "Priya Nair", email: "priya@example.com", source: "Referral", stage: "won", assignedTo: "a1", tags: ["Investor"], propertyInterest: "Whitefield Greens", budget: "₹1.2 Cr", value: 12500000, createdAt: new Date(Date.now() - 4.3e8).toISOString() },
];

interface LeadsState {
  leads: Lead[];
  mode: DistributionMode;
  rotationIndex: number;
  setMode: (mode: DistributionMode) => void;
  addLead: (input: NewLeadInput) => void;
  moveLead: (id: string, stage: LeadStage) => void;
  assignLead: (id: string, agentId: string | null) => void;
  claimLead: (id: string) => void;
  removeLead: (id: string) => void;
}

export const useLeadsStore = create<LeadsState>()(
  persist(
    (set) => ({
      leads: seedLeads,
      mode: "rotation",
      rotationIndex: 0,
      setMode: (mode) => set({ mode }),
      addLead: (input) =>
        set((s) => {
          const { assignedTo, nextRotation } = assignFor(s.mode, s.rotationIndex);
          const lead: Lead = {
            id: uid(),
            name: input.name,
            email: input.email,
            phone: input.phone,
            source: input.source,
            stage: "new",
            assignedTo,
            tags: input.tags ?? [],
            propertyInterest: input.propertyInterest,
            budget: input.budget,
            value: input.value,
            createdAt: new Date().toISOString(),
          };
          return { leads: [lead, ...s.leads], rotationIndex: nextRotation };
        }),
      moveLead: (id, stage) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, stage } : l)) })),
      assignLead: (id, agentId) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, assignedTo: agentId } : l)) })),
      claimLead: (id) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, assignedTo: SELF_ID } : l)) })),
      removeLead: (id) => set((s) => ({ leads: s.leads.filter((l) => l.id !== id) })),
    }),
    { name: "nestmatch-leads-v1" }
  )
);
