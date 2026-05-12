"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CalendarEvent } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface CalendarState {
  events: CalendarEvent[];
  lastGoogleSync?: string;
  add: (e: Omit<CalendarEvent, "id">) => void;
  update: (id: string, patch: Partial<CalendarEvent>) => void;
  remove: (id: string) => void;
  upsertGoogleEvents: (events: Omit<CalendarEvent, "id">[], syncedAt: string) => number;
  removeGoogleEvents: () => number;
}

const seed = buildSeed();

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: seed.events,
      add: (e) => set((s) => ({ events: [...s.events, { ...e, id: uid("ev"), source: e.source ?? "local" }] })),
      update: (id, patch) =>
        set((s) => ({ events: s.events.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
      upsertGoogleEvents: (incoming, syncedAt) => {
        let touched = 0;
        set((s) => {
          const byGoogleId = new Map<string, CalendarEvent>();
          // index existing google events
          for (const e of s.events) if (e.googleId) byGoogleId.set(e.googleId, e);
          const next: CalendarEvent[] = s.events.filter((e) => !e.googleId);
          for (const inc of incoming) {
            if (!inc.googleId) continue;
            const prev = byGoogleId.get(inc.googleId);
            const id = prev?.id ?? uid("g");
            next.push({ ...prev, ...inc, id, source: "google" });
            touched++;
          }
          return { events: next, lastGoogleSync: syncedAt };
        });
        return touched;
      },
      removeGoogleEvents: () => {
        let removed = 0;
        set((s) => {
          const next = s.events.filter((e) => {
            if (e.googleId) { removed++; return false; }
            return true;
          });
          return { events: next, lastGoogleSync: undefined };
        });
        return removed;
      },
    }),
    { name: "lifeos:calendar:v3", storage: createJSONStorage(() => localStorage) },
  ),
);
