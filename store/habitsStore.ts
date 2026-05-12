"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Habit, HabitLogs, DateKey } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { todayKey } from "@/lib/utils";

interface HabitsState {
  habits: Habit[];
  logs: HabitLogs;
  hydrated: boolean;
  toggle: (habitId: string, date?: DateKey) => boolean; // returns new value
  setLog: (habitId: string, date: DateKey, value: boolean) => void;
  addHabit: (h: Omit<Habit, "id" | "core">) => void;
  removeHabit: (habitId: string) => void;
}

const seed = buildSeed();

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: seed.habits,
      logs: seed.habitLogs,
      hydrated: false,
      toggle: (habitId, date = todayKey()) => {
        const cur = get().logs[date]?.[habitId] ?? false;
        const next = !cur;
        set((s) => ({
          logs: { ...s.logs, [date]: { ...(s.logs[date] ?? {}), [habitId]: next } },
        }));
        return next;
      },
      setLog: (habitId, date, value) =>
        set((s) => ({
          logs: { ...s.logs, [date]: { ...(s.logs[date] ?? {}), [habitId]: value } },
        })),
      addHabit: (h) =>
        set((s) => ({
          habits: [...s.habits, { ...h, id: `h_${Math.random().toString(36).slice(2, 7)}`, core: false }],
        })),
      removeHabit: (habitId) =>
        set((s) => ({ habits: s.habits.filter((x) => x.id !== habitId) })),
    }),
    {
      name: "lifeos:habits:v2",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (s) => { if (s) s.hydrated = true; },
    },
  ),
);
