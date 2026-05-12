"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useSchoolStore } from "@/store/schoolStore";
import { daysUntil } from "@/lib/scoring";
import { Badge } from "@/components/ui/Badge";
import { AlarmClock } from "lucide-react";

export function UpcomingCard() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);

  const upcoming = assignments
    .filter((a) => !a.done)
    .map((a) => ({ ...a, days: daysUntil(a.due), cls: classes.find((c) => c.id === a.classId) }))
    .filter((a) => a.days >= 0 && a.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader title="Upcoming deadlines" subtitle="Next 2 weeks" icon={<AlarmClock size={16} className="text-rose-300" />} />
      <div className="space-y-2">
        {upcoming.length === 0 && <p className="text-sm text-white/40">Nothing due. Go build a moat.</p>}
        {upcoming.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <div className="h-8 w-1 rounded-full" style={{ background: a.cls?.color ?? "#a78bfa" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{a.title}</div>
              <div className="text-[11px] text-white/40">{a.cls?.code ?? "—"}</div>
            </div>
            <Badge tone={a.days <= 1 ? "rose" : a.days <= 3 ? "amber" : "default"}>
              {a.days === 0 ? "today" : `${a.days}d`}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
