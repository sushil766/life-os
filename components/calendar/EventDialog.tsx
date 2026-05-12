"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCalendarStore } from "@/store/calendarStore";
import type { EventKind } from "@/lib/types";

const KINDS: { id: EventKind; label: string; color: string }[] = [
  { id: "class", label: "Class", color: "#a78bfa" },
  { id: "assignment", label: "Assignment", color: "#fb7185" },
  { id: "exam", label: "Exam", color: "#f97316" },
  { id: "work", label: "Work", color: "#22d3ee" },
  { id: "workout", label: "Workout", color: "#fbbf24" },
  { id: "routine", label: "Routine", color: "#34d399" },
  { id: "personal", label: "Personal", color: "#94a3b8" },
];

export function EventDialog({ open, onClose, date }: { open: boolean; onClose: () => void; date: string | null }) {
  const add = useCalendarStore((s) => s.add);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [kind, setKind] = useState<EventKind>("personal");

  useEffect(() => {
    if (open) { setTitle(""); setStartTime("09:00"); setEndTime("10:00"); setKind("personal"); }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const color = KINDS.find((k) => k.id === kind)?.color ?? "#a78bfa";
    add({ title: title.trim(), date, startTime, endTime, kind, color });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Add event · ${date ?? ""}`}>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <Select value={kind} onChange={(e) => setKind(e.target.value as EventKind)}>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </Select>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add event</Button>
        </div>
      </form>
    </Dialog>
  );
}
