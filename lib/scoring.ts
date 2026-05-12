import type { Habit, HabitLogs, DateKey } from "./types";
import { XP } from "./constants";
import { todayKey } from "./utils";
import { addDays, subDays, parseISO, differenceInCalendarDays } from "date-fns";

export function levelFromXp(xp: number): { level: number; into: number; need: number; pct: number } {
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 50)));
  const curr = 50 * level * level;
  const next = 50 * (level + 1) * (level + 1);
  const into = Math.max(0, xp - curr);
  const need = next - curr;
  return { level, into, need, pct: Math.min(1, into / need) };
}

export function dailyScore(habits: Habit[], logs: HabitLogs, date: DateKey = todayKey()): number {
  if (habits.length === 0) return 0;
  const day = logs[date] ?? {};
  let done = 0;
  for (const h of habits) if (day[h.id]) done++;
  return Math.round((done / habits.length) * 100);
}

export function streakFor(habits: Habit[], logs: HabitLogs, habitId: string, today: DateKey = todayKey()): number {
  // count consecutive days going back from today (or yesterday if today isn't done).
  let cursor = parseISO(today);
  // If today is not done, start counting from yesterday so a partial day doesn't break it.
  if (!logs[today]?.[habitId]) cursor = subDays(cursor, 1);
  let streak = 0;
  while (true) {
    const k = isoKey(cursor);
    if (logs[k]?.[habitId]) {
      streak++;
      cursor = subDays(cursor, 1);
    } else break;
    if (streak > 1000) break;
  }
  return streak;
}

export function overallDisciplineStreak(habits: Habit[], logs: HabitLogs, today: DateKey = todayKey()): number {
  let cursor = parseISO(today);
  // Allow today partial — start at today if all done, else yesterday.
  if (!isFullDay(habits, logs, today)) cursor = subDays(cursor, 1);
  let s = 0;
  while (s < 1000) {
    const k = isoKey(cursor);
    if (isFullDay(habits, logs, k)) {
      s++;
      cursor = subDays(cursor, 1);
    } else break;
  }
  return s;
}

export function isFullDay(habits: Habit[], logs: HabitLogs, date: DateKey): boolean {
  const day = logs[date] ?? {};
  for (const h of habits) if (!day[h.id]) return false;
  return habits.length > 0;
}

export function weekKeys(today: DateKey = todayKey()): DateKey[] {
  // returns last 7 days including today, oldest first
  const out: DateKey[] = [];
  const t = parseISO(today);
  for (let i = 6; i >= 0; i--) out.push(isoKey(subDays(t, i)));
  return out;
}

export function lastNDays(n: number, today: DateKey = todayKey()): DateKey[] {
  const out: DateKey[] = [];
  const t = parseISO(today);
  for (let i = n - 1; i >= 0; i--) out.push(isoKey(subDays(t, i)));
  return out;
}

export function nextNDays(n: number, today: DateKey = todayKey()): DateKey[] {
  const out: DateKey[] = [];
  const t = parseISO(today);
  for (let i = 0; i < n; i++) out.push(isoKey(addDays(t, i)));
  return out;
}

export function isoKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysUntil(due: DateKey, today: DateKey = todayKey()): number {
  return differenceInCalendarDays(parseISO(due), parseISO(today));
}

export function weekCompletion(habits: Habit[], logs: HabitLogs, today: DateKey = todayKey()): number {
  const days = weekKeys(today);
  let total = 0;
  let done = 0;
  for (const d of days) {
    for (const h of habits) {
      total++;
      if (logs[d]?.[h.id]) done++;
    }
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export function bestAndWorstHabit(habits: Habit[], logs: HabitLogs, today: DateKey = todayKey()) {
  const days = weekKeys(today);
  const scores = habits.map((h) => {
    let done = 0;
    for (const d of days) if (logs[d]?.[h.id]) done++;
    return { habit: h, pct: Math.round((done / days.length) * 100) };
  });
  scores.sort((a, b) => b.pct - a.pct);
  return { best: scores[0], worst: scores[scores.length - 1], all: scores };
}

export function xpFromLogToggle(prev: boolean, now: boolean): number {
  if (prev === now) return 0;
  return now ? XP.perHabit : -XP.perHabit;
}
