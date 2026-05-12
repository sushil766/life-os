"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Task } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface TasksState {
  tasks: Task[];
  add: (t: Omit<Task, "id" | "done">) => void;
  toggle: (id: string) => boolean;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Task>) => void;
}

const seed = buildSeed();

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: seed.tasks,
      add: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid("t"), done: false }] })),
      toggle: (id) => {
        const cur = get().tasks.find((x) => x.id === id);
        const next = !(cur?.done ?? false);
        set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: next } : x)) }));
        return next;
      },
      remove: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
      update: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    }),
    {
      name: "lifeos:tasks:v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
