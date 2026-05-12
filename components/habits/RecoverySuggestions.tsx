"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useHabitsStore } from "@/store/habitsStore";
import { useState } from "react";
import { callAI } from "@/lib/aiClient";
import { bestAndWorstHabit, weekCompletion, streakFor } from "@/lib/scoring";
import { LifeBuoy } from "lucide-react";

export function RecoverySuggestions() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { best, worst } = bestAndWorstHabit(habits, logs);
      const week = weekCompletion(habits, logs);
      const streaks = habits.map((h) => ({ name: h.name, days: streakFor(habits, logs, h.id) }));
      const r = await callAI("analyze_habits", { best, worst, weekCompletion: week, streaks });
      setText(r.text);
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader
        title="Recovery suggestions"
        subtitle="AI looks at the weak spots and proposes specific fixes."
        icon={<LifeBuoy size={16} className="text-rose-300" />}
        right={<Button size="sm" onClick={run} disabled={loading}>{loading ? "Thinking…" : "Analyze"}</Button>}
      />
      {text ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">{text}</p>
      ) : (
        <p className="text-sm text-white/40">Click analyze to get personalized recovery advice based on your habit data.</p>
      )}
    </Card>
  );
}
