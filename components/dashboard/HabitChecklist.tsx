"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { useHabitsStore } from "@/store/habitsStore";
import { useUserStore } from "@/store/userStore";
import { ACCENT_HEX, XP } from "@/lib/constants";
import { streakFor } from "@/lib/scoring";
import { todayKey } from "@/lib/utils";

export function HabitChecklist() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const toggle = useHabitsStore((s) => s.toggle);
  const addXp = useUserStore((s) => s.addXp);
  const today = todayKey();

  return (
    <Card>
      <CardHeader title="Today's habits" subtitle="Tap a habit to log it. +10 XP each." />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {habits.map((h) => {
          const done = !!logs[today]?.[h.id];
          const streak = streakFor(habits, logs, h.id);
          return (
            <button
              key={h.id}
              onClick={() => {
                const next = toggle(h.id);
                addXp(next ? XP.perHabit : -XP.perHabit);
              }}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.05]"
            >
              <motion.div
                animate={{ scale: done ? 1.05 : 1 }}
                className="grid h-10 w-10 place-items-center rounded-xl text-xl"
                style={{
                  background: done ? `${ACCENT_HEX[h.accent]}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${done ? ACCENT_HEX[h.accent] + "55" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <span>{h.emoji}</span>
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-white">{h.name}</span>
                  {h.target && <span className="ml-2 text-[10px] text-white/40">{h.target}</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
                  <span>{done ? "Done today" : "Tap to complete"}</span>
                  {streak > 0 && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                      🔥 {streak}d
                    </span>
                  )}
                </div>
              </div>
              <div
                className="grid h-6 w-6 place-items-center rounded-md border transition"
                style={{
                  background: done ? ACCENT_HEX[h.accent] : "transparent",
                  borderColor: done ? ACCENT_HEX[h.accent] : "rgba(255,255,255,0.15)",
                }}
              >
                {done && <Check size={14} className="text-black" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
