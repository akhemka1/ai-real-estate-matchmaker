import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompareState {
  propertyIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      propertyIds: [],
      add: (id) =>
        set((s) => {
          if (s.propertyIds.includes(id) || s.propertyIds.length >= MAX_COMPARE)
            return s;
          return { propertyIds: [...s.propertyIds, id] };
        }),
      remove: (id) =>
        set((s) => ({
          propertyIds: s.propertyIds.filter((p) => p !== id),
        })),
      clear: () => set({ propertyIds: [] }),
      isInCompare: (id) => get().propertyIds.includes(id),
    }),
    { name: "nestmatch-compare" }
  )
);
