"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { useSchoolStore } from "@/store/schoolStore";
import { daysUntil, lastNDays } from "@/lib/scoring";
import { prettyDate, todayKey, uid } from "@/lib/utils";
import { Check, Plus, Trash2, GraduationCap, Sparkles, BookOpen, Pencil } from "lucide-react";
import type { Assignment } from "@/lib/types";
import { Textarea } from "@/components/ui/Input";
import { callAI } from "@/lib/aiClient";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function SchoolPage() {
  return (
    <Hydrated>
      <PageHeader title="School" subtitle="Classes, assignments, study sessions, and an AI study planner." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7"><AssignmentList /></div>
        <div className="col-span-12 lg:col-span-5"><GpaCard /></div>
        <div className="col-span-12 lg:col-span-7"><ClassesPanel /></div>
        <div className="col-span-12 lg:col-span-5"><StudySessionLog /></div>
        <div className="col-span-12"><AIStudyPlanner /></div>
      </div>
    </Hydrated>
  );
}

function AssignmentList() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const toggle = useSchoolStore((s) => s.toggleAssignment);
  const remove = useSchoolStore((s) => s.removeAssignment);
  const add = useSchoolStore((s) => s.addAssignment);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [due, setDue] = useState(todayKey());
  const [editing, setEditing] = useState<Assignment | null>(null);

  const list = [...assignments].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));

  return (
    <Card>
      <CardHeader
        title="Assignments"
        icon={<BookOpen size={16} className="text-sky-300" />}
        right={<Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>Add</Button>}
      />
      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
        {list.map((a) => {
          const cls = classes.find((c) => c.id === a.classId);
          const days = daysUntil(a.due);
          return (
            <div key={a.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
              <button onClick={() => toggle(a.id)} className={`grid h-5 w-5 place-items-center rounded-md border ${a.done ? "border-emerald-400 bg-emerald-400" : "border-white/20 hover:border-white/40"}`}>
                {a.done && <Check size={12} className="text-black" strokeWidth={3} />}
              </button>
              <div className="h-6 w-1 rounded-full" style={{ background: cls?.color ?? "#a78bfa" }} />
              <button
                onClick={() => setEditing(a)}
                className="min-w-0 flex-1 text-left rounded-md hover:bg-white/[0.03] -mx-1 px-1 py-0.5 transition"
                title="Click to edit"
              >
                <div className={`truncate text-sm ${a.done ? "text-white/40 line-through" : "text-white"}`}>{a.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  <span>{cls?.code}</span><span>·</span><span>{prettyDate(a.due)}</span>
                  {a.weight && <Badge tone="default">{a.weight}%</Badge>}
                </div>
              </button>
              {!a.done && (
                <Badge tone={days < 0 ? "rose" : days <= 1 ? "rose" : days <= 3 ? "amber" : "default"}>
                  {days < 0 ? `${-days}d late` : days === 0 ? "today" : `${days}d`}
                </Badge>
              )}
              <button onClick={() => setEditing(a)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-sky-300" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(a.id)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-300" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="New assignment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            add({ title: title.trim(), due, classId });
            setOpen(false); setTitle("");
          }}
          className="space-y-3"
        >
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </Select>
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add</Button>
          </div>
        </form>
      </Dialog>
      <EditAssignmentDialog assignment={editing} onClose={() => setEditing(null)} />
    </Card>
  );
}

function EditAssignmentDialog({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const classes = useSchoolStore((s) => s.classes);
  const update = useSchoolStore((s) => s.updateAssignment);
  const remove = useSchoolStore((s) => s.removeAssignment);
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [due, setDue] = useState(todayKey());
  const [weight, setWeight] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setClassId(assignment.classId);
      setDue(assignment.due);
      setWeight(assignment.weight != null ? String(assignment.weight) : "");
      setNotes(assignment.notes ?? "");
    }
  }, [assignment]);

  if (!assignment) return null;

  return (
    <Dialog open={!!assignment} onClose={onClose} title="Edit assignment">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const w = weight.trim() === "" ? undefined : Number(weight);
          update(assignment.id, {
            title: title.trim(),
            classId,
            due,
            weight: w != null && !Number.isNaN(w) ? w : undefined,
            notes: notes.trim() || undefined,
          });
          onClose();
        }}
        className="space-y-3"
      >
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </Select>
        <div className="flex gap-2">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Weight %"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-32"
          />
        </div>
        <Textarea
          rows={3}
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            icon={<Trash2 size={14} />}
            onClick={() => { remove(assignment.id); onClose(); }}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

function GpaCard() {
  const classes = useSchoolStore((s) => s.classes);
  return (
    <Card>
      <CardHeader title="GPA tracker" subtitle="Set your target grade per class · plug in real grades later." icon={<GraduationCap size={16} className="text-violet-300" />} />
      <div className="space-y-1.5">
        {classes.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <div className="h-6 w-1 rounded-full" style={{ background: c.color }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{c.code} — {c.name}</div>
              <div className="text-[11px] text-white/40">{c.instructor}</div>
            </div>
            <Badge tone="violet">Target {c.gradeTarget ?? "—"}</Badge>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/40">Grades are placeholders. Wire up your school portal in <code className="rounded bg-white/[0.06] px-1">lib/integrations/</code> later.</p>
    </Card>
  );
}

function ClassesPanel() {
  const classes = useSchoolStore((s) => s.classes);
  const addClass = useSchoolStore((s) => s.addClass);
  const remove = useSchoolStore((s) => s.removeClass);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  return (
    <Card>
      <CardHeader title="Classes" subtitle={`${classes.length} active`} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {classes.map((c) => (
          <div key={c.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
            <div className="h-8 w-8 rounded-lg" style={{ background: `${c.color}33`, border: `1px solid ${c.color}55` }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{c.code}</div>
              <div className="truncate text-[11px] text-white/50">{c.name}</div>
            </div>
            <button onClick={() => remove(c.id)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-300">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim() || !name.trim()) return;
          const idx = classes.length % 8;
          const colors = ["#a78bfa","#34d399","#fbbf24","#fb7185","#38bdf8","#f472b6","#facc15","#60a5fa"];
          addClass({ code: code.trim(), name: name.trim(), color: colors[idx] });
          setCode(""); setName("");
        }}
      >
        <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} className="w-28" />
        <Input placeholder="Course name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="primary" icon={<Plus size={14} />}>Add</Button>
      </form>
    </Card>
  );
}

function StudySessionLog() {
  const sessions = useSchoolStore((s) => s.studySessions);
  const classes = useSchoolStore((s) => s.classes);
  const addSession = useSchoolStore((s) => s.addSession);
  const days = lastNDays(14);
  const data = days.map((k) => {
    const total = sessions.filter((s) => s.date === k).reduce((acc, s) => acc + s.minutes, 0);
    return { date: k, label: k.slice(5), minutes: total };
  });
  const [minutes, setMinutes] = useState(45);
  const [classId, setClassId] = useState(classes[0]?.id ?? "");

  return (
    <Card>
      <CardHeader title="Study sessions" subtitle="Last 14 days" />
      <div className="h-44 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="minutes" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addSession({ classId, date: todayKey(), minutes });
          setMinutes(45);
        }}
      >
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="flex-1">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
        </Select>
        <Input type="number" min={5} max={300} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value || "0", 10))} className="w-24" />
        <Button type="submit" variant="primary">Log</Button>
      </form>
    </Card>
  );
}

function AIStudyPlanner() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const upcoming = assignments
        .filter((a) => !a.done)
        .map((a) => ({ title: a.title, daysLeft: daysUntil(a.due), classCode: classes.find((c) => c.id === a.classId)?.code }))
        .sort((a, b) => a.daysLeft - b.daysLeft);
      const r = await callAI("study_plan", { upcoming });
      setText(r.text);
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader
        title="AI study planner"
        subtitle="Smart prioritization based on weight and due date."
        icon={<Sparkles size={16} className="text-violet-300" />}
        right={<Button size="sm" variant="primary" onClick={run} disabled={loading}>{loading ? "Thinking…" : "Plan my week"}</Button>}
      />
      {text && <pre className="whitespace-pre-wrap rounded-xl bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-white/85">{text}</pre>}
      {!text && <p className="text-sm text-white/40">Click "Plan my week" to generate a study schedule.</p>}
    </Card>
  );
}
