"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SchoolClass, Assignment, StudySession } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface SchoolState {
  classes: SchoolClass[];
  assignments: Assignment[];
  studySessions: StudySession[];
  addClass: (c: Omit<SchoolClass, "id">) => void;
  removeClass: (id: string) => void;
  addAssignment: (a: Omit<Assignment, "id" | "done">) => void;
  toggleAssignment: (id: string) => void;
  updateAssignment: (id: string, patch: Partial<Omit<Assignment, "id">>) => void;
  removeAssignment: (id: string) => void;
  addSession: (s: Omit<StudySession, "id">) => void;
}

const seed = buildSeed();

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      classes: seed.classes,
      assignments: seed.assignments,
      studySessions: seed.studySessions,
      addClass: (c) => set((s) => ({ classes: [...s.classes, { ...c, id: uid("cls") }] })),
      removeClass: (id) => set((s) => ({ classes: s.classes.filter((x) => x.id !== id) })),
      addAssignment: (a) =>
        set((s) => ({ assignments: [...s.assignments, { ...a, id: uid("as"), done: false }] })),
      toggleAssignment: (id) =>
        set((s) => ({
          assignments: s.assignments.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
        })),
      updateAssignment: (id, patch) =>
        set((s) => ({
          assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeAssignment: (id) =>
        set((s) => ({ assignments: s.assignments.filter((x) => x.id !== id) })),
      addSession: (sess) =>
        set((s) => ({ studySessions: [...s.studySessions, { ...sess, id: uid("ss") }] })),
    }),
    { name: "lifeos:school:v3", storage: createJSONStorage(() => localStorage) },
  ),
);
