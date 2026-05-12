"use client";
import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCalendarStore } from "@/store/calendarStore";
import { useSchoolStore } from "@/store/schoolStore";
import { isoKey } from "@/lib/scoring";
import { addDays, format, startOfWeek, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { EventDialog } from "./EventDialog";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM - 9 PM
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toMinutes(t?: string) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function WeeklyPlanner() {
  const events = useCalendarStore((s) => s.events);
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);

  const dayEvents = (d: Date) => {
    const k = isoKey(d);
    const dow = d.getDay();
    const recurring = events.filter((e) => e.recurring === "weekly" && e.dayOfWeek === dow);
    const oneOff = events.filter((e) => e.date === k && (!e.recurring || e.recurring === "none"));
    const dueAssignments = assignments
      .filter((a) => a.due === k)
      .map((a) => {
        const cls = classes.find((c) => c.id === a.classId);
        return {
          id: `due_${a.id}`,
          title: `Due: ${a.title}`,
          startTime: "23:30",
          endTime: "23:59",
          kind: "assignment" as const,
          color: cls?.color ?? "#fb7185",
          classId: a.classId,
          date: k,
        };
      });
    return [...recurring, ...oneOff, ...dueAssignments]
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  };

  return (
    <Card>
      <CardHeader
        title={`Week of ${format(anchor, "MMM d")}`}
        subtitle="Time-blocked, color-coded · click any cell to add"
        right={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setAnchor(addDays(anchor, -7))} icon={<ChevronLeft size={14} />}>Prev</Button>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(startOfWeek(new Date(), { weekStartsOn: 0 }))}>This week</Button>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(addDays(anchor, 7))} icon={<ChevronRight size={14} />}>Next</Button>
          </div>
        }
      />
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* header */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-white/[0.06] pb-2 text-[10px] uppercase tracking-wider text-white/40">
            <div></div>
            {week.map((d) => {
              const today = isoKey(d) === isoKey(new Date());
              return (
                <div key={d.toISOString()} className={`flex flex-col items-center ${today ? "text-violet-300" : ""}`}>
                  <span>{DAYS[d.getDay()]}</span>
                  <span className="text-white/80 text-sm font-semibold">{format(d, "d")}</span>
                </div>
              );
            })}
          </div>

          {/* body */}
          <div className="relative grid grid-cols-[40px_repeat(7,1fr)]">
            {/* hours column */}
            <div className="flex flex-col">
              {HOURS.map((h) => (
                <div key={h} className="h-12 border-b border-white/[0.04] pr-1 text-right text-[10px] text-white/40">
                  {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "a" : "p"}
                </div>
              ))}
            </div>
            {/* day columns */}
            {week.map((d) => {
              const evs = dayEvents(d);
              return (
                <div
                  key={d.toISOString()}
                  className="relative h-[768px] border-l border-white/[0.04]"
                  onDoubleClick={() => setDialogDate(isoKey(d))}
                >
                  {HOURS.map((h) => (
                    <div key={h} className="h-12 border-b border-white/[0.04]" />
                  ))}
                  {evs.map((e) => {
                    const start = toMinutes(e.startTime ?? "08:00");
                    const end = toMinutes(e.endTime ?? "09:00");
                    const top = ((start - HOURS[0] * 60) / 60) * 48; // 48px/hour
                    const height = Math.max(18, ((end - start) / 60) * 48);
                    return (
                      <div
                        key={e.id}
                        className="absolute left-1 right-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-[10px] leading-tight"
                        style={{
                          top,
                          height,
                          background: `${e.color ?? "#a78bfa"}22`,
                          borderColor: `${e.color ?? "#a78bfa"}55`,
                          color: e.color ?? "#a78bfa",
                        }}
                        title={e.title}
                      >
                        <div className="truncate font-semibold">{e.title}</div>
                        <div className="opacity-70">{e.startTime}{e.endTime ? `–${e.endTime}` : ""}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-white/40">Tip: double-click a day to add an event.</div>

      <EventDialog
        open={!!dialogDate}
        onClose={() => setDialogDate(null)}
        date={dialogDate}
      />
    </Card>
  );
}
