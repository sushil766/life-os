"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useHabitsStore } from "@/store/habitsStore";
import { useTasksStore } from "@/store/tasksStore";
import { useCalendarStore } from "@/store/calendarStore";
import { dailyScore } from "@/lib/scoring";
import { todayKey } from "@/lib/utils";
import { callAI } from "@/lib/aiClient";
import { Wand2, Sparkles } from "lucide-react";

export function PlanMyDayCard() {
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const tasks = useTasksStore((s) => s.tasks);
  const events = useCalendarStore((s) => s.events);
  const today = todayKey();
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const todayDow = new Date().getDay();
  const todayEvents = events
    .filter((e) => e.date === today || (e.recurring === "weekly" && e.dayOfWeek === todayDow))
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  const todayTasks = tasks.filter((t) => t.date === today && !t.done);

  const run = async () => {
    setLoading(true);
    try {
      const remainingHabits = habits.filter((h) => !logs[today]?.[h.id]).map((h) => h.name);
      const r = await callAI("plan_day", {
        score: dailyScore(habits, logs, today),
        remainingHabits,
        tasks: todayTasks.map((t) => ({ title: t.title, priority: t.priority })),
        events: todayEvents.map((e) => ({ title: e.title, startTime: e.startTime, endTime: e.endTime, kind: e.kind })),
      });
      setText(r.text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Plan my day" subtitle="AI builds a timeline from your habits, tasks & calendar." icon={<Wand2 size={16} className="text-sky-300" />} />
      {!text && !loading && (
        <Button onClick={run} variant="primary" icon={<Sparkles size={14} />}>Build my day plan</Button>
      )}
      {(text || loading) && (
        <div>
          <pre className="mt-1 whitespace-pre-wrap rounded-xl bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-white/85">
            {loading ? "Generating plan…" : text}
          </pre>
          <div className="mt-3"><Button size="sm" onClick={run} disabled={loading}>Regenerate</Button></div>
        </div>
      )}
    </Card>
  );
}
