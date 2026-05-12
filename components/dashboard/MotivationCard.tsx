"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";
import { useHabitsStore } from "@/store/habitsStore";
import {
  dailyScore,
  levelFromXp,
  overallDisciplineStreak,
} from "@/lib/scoring";
import { todayKey } from "@/lib/utils";
import { callAI } from "@/lib/aiClient";
import { Sparkles, RotateCw } from "lucide-react";

export function MotivationCard() {
  const xp = useUserStore((s) => s.xp);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const today = todayKey();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchMotivation = async () => {
    setLoading(true);
    try {
      const score = dailyScore(habits, logs, today);
      const lvl = levelFromXp(xp);
      const streak = overallDisciplineStreak(habits, logs);
      const remainingHabits = habits.filter((h) => !logs[today]?.[h.id]).map((h) => h.name);
      const r = await callAI("motivate", { score, level: lvl.level, streak, remainingHabits });
      setText(r.text);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMotivation(); /* eslint-disable-next-line */ }, []);

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <CardHeader
        title="Daily push"
        icon={<Sparkles size={16} className="text-violet-300" />}
        right={
          <Button size="sm" variant="ghost" onClick={fetchMotivation} disabled={loading} icon={<RotateCw size={12} className={loading ? "animate-spin" : ""} />}>
            New
          </Button>
        }
      />
      <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">
        {loading && !text ? "Thinking…" : text}
      </p>
    </Card>
  );
}
