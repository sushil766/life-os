"use client";
import { Card, CardHeader } from "@/components/ui/Card";
import { useSchoolStore } from "@/store/schoolStore";
import { Badge } from "@/components/ui/Badge";
import { daysUntil } from "@/lib/scoring";
import { prettyDate } from "@/lib/utils";

export function DeadlineList() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const list = assignments
    .filter((a) => !a.done)
    .map((a) => ({ ...a, days: daysUntil(a.due), cls: classes.find((c) => c.id === a.classId) }))
    .sort((a, b) => a.days - b.days);

  return (
    <Card>
      <CardHeader title="All deadlines" subtitle={`${list.length} open`} />
      <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
        {list.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <div className="h-8 w-1 rounded-full" style={{ background: a.cls?.color ?? "#a78bfa" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{a.title}</div>
              <div className="text-[11px] text-white/40">{a.cls?.code} · {prettyDate(a.due)}</div>
            </div>
            <Badge tone={a.days < 0 ? "rose" : a.days <= 1 ? "rose" : a.days <= 3 ? "amber" : "default"}>
              {a.days < 0 ? `${-a.days}d late` : a.days === 0 ? "today" : `${a.days}d`}
            </Badge>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-white/40">Nothing on your plate.</p>}
      </div>
    </Card>
  );
}
