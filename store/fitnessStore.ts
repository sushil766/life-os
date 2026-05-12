"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Workout } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface FitnessState {
  workouts: Workout[];
  addWorkout: (w: Omit<Workout, "id">) => void;
  removeWorkout: (id: string) => void;
}

const seed = buildSeed();

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set) => ({
      workouts: seed.workouts,
      addWorkout: (w) => set((s) => ({ workouts: [...s.workouts, { ...w, id: uid("w") }] })),
      removeWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((x) => x.id !== id) })),
    }),
    { name: "lifeos:fitness:v2", storage: createJSONStorage(() => localStorage) },
  ),
);
