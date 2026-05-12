"use client";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCalendarStore } from "@/store/calendarStore";
import { useSchoolStore } from "@/store/schoolStore";
import { useHabitsStore } from "@/store/habitsStore";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { isoKey, dailyScore } from "@/lib/scoring";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthlyCalendar() {
  const events = useCalendarStore((s) => s.events);
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);

  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  return (
    <Card>
      <CardHeader
        title={format(anchor, "MMMM yyyy")}
        subtitle="Monthly grid · color marks daily score"
        right={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setAnchor(addMonths(anchor, -1))} icon={<ChevronLeft size={14} />}>Prev</Button>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfMonth(new Date()))}>Today</Button>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(addMonths(anchor, 1))} icon={<ChevronRight size={14} />}>Next</Button>
          </div>
        }
      />
      <div className="grid grid-cols-7 gap-1.5 text-xs">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="px-1 pb-1 text-[10px] uppercase tracking-wider text-white/40">{d}</div>
        ))}
        {days.map((d) => {
          const k = isoKey(d);
          const inMonth = isSameMonth(d, anchor);
          const score = dailyScore(habits, logs, k);
          const dueToday = assignments.filter((a) => a.due === k);
          const evToday = events.filter((e) => e.date === k);
          const bg =
            score >= 80 ? "rgba(52,211,153,0.18)" :
            score >= 50 ? "rgba(167,139,250,0.18)" :
            score >= 25 ? "rgba(251,191,36,0.15)" :
            score > 0 ? "rgba(251,113,133,0.12)" :
            "rgba(255,255,255,0.02)";
          return (
            <div
              key={k}
              className={`min-h-[78px] rounded-lg border p-1.5 ${inMonth ? "border-white/[0.06]" : "border-white/[0.03] opacity-50"}`}
              style={{ background: bg }}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] ${k === isoKey(new Date()) ? "font-bold text-violet-300" : "text-white/70"}`}>
                  {format(d, "d")}
                </span>
                {score > 0 && <span className="text-[9px] text-white/50">{score}</span>}
              </div>
              <div className="mt-1 space-y-0.5">
                {dueToday.slice(0, 2).map((a) => {
                  const cls = classes.find((c) => c.id === a.classId);
                  return (
                    <div key={a.id} className="truncate rounded px-1 text-[9px]" style={{ background: `${cls?.color}33`, color: cls?.color }}>
                      ⚑ {a.title}
                    </div>
                  );
                })}
                {evToday.slice(0, 1).map((e) => (
                  <div key={e.id} className="truncate rounded px-1 text-[9px]" style={{ background: `${e.color}22`, color: e.color }}>
                    {e.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
