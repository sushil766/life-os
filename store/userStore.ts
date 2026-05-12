"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Reflection, Goal } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface UserState {
  name: string;
  xp: number;
  reflections: Reflection[];
  goals: Goal[];
  setName: (n: string) => void;
  addXp: (delta: number) => void;
  upsertReflection: (r: Reflection) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
}

const seed = buildSeed();

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: "Sushil",
      xp: seed.xp,
      reflections: seed.reflections,
      goals: seed.goals,
      setName: (n) => set({ name: n }),
      addXp: (delta) => set((s) => ({ xp: Math.max(0, s.xp + delta) })),
      upsertReflection: (r) =>
        set((s) => ({
          reflections: [...s.reflections.filter((x) => x.date !== r.date), r].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid("goal") }] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    {
      name: "lifeos:user:v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
