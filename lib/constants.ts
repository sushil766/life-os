import type { Habit, ExpenseCategory } from "./types";

export const CORE_HABITS: Habit[] = [
  { id: "workout", name: "Workout", emoji: "🏋️", accent: "amber", core: true },
  { id: "water", name: "Water", emoji: "💧", target: "3L", accent: "sky", core: true },
  { id: "meals", name: "Meal consistency", emoji: "🍱", accent: "rose", core: true },
  { id: "sleep", name: "Sleep 8h+", emoji: "😴", target: "8h", accent: "violet", core: true },
  { id: "work", name: "Deep work", emoji: "💻", accent: "emerald", core: true },
  { id: "read", name: "Read 10 pages", emoji: "📚", target: "10 pg", accent: "slate", core: true },
  { id: "stretch", name: "Stretch / Foam roll", emoji: "🧘", accent: "sky", core: true },
  { id: "vitamins", name: "Vitamins", emoji: "💊", accent: "amber", core: true },
];

export const ACCENT_HEX: Record<Habit["accent"], string> = {
  emerald: "#34d399",
  violet: "#a78bfa",
  sky: "#38bdf8",
  amber: "#fbbf24",
  rose: "#fb7185",
  slate: "#94a3b8",
};

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; color: string }[] = [
  { id: "food", label: "Food & dining", color: "#fb7185" },
  { id: "groceries", label: "Groceries", color: "#34d399" },
  { id: "transport", label: "Transport", color: "#38bdf8" },
  { id: "rent", label: "Rent", color: "#a78bfa" },
  { id: "utilities", label: "Utilities", color: "#fbbf24" },
  { id: "school", label: "School", color: "#60a5fa" },
  { id: "fitness", label: "Fitness", color: "#f97316" },
  { id: "subscriptions", label: "Subscriptions", color: "#c084fc" },
  { id: "entertainment", label: "Entertainment", color: "#f472b6" },
  { id: "shopping", label: "Shopping", color: "#fde047" },
  { id: "other", label: "Other", color: "#94a3b8" },
];

export const CLASS_COLORS = [
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#38bdf8",
  "#f472b6",
  "#facc15",
  "#60a5fa",
];

export const XP = {
  perHabit: 10,
  perTask: 5,
  perWorkout: 25,
  perfectDayBonus: 50,
};

// Gentle level curve. Level n requires 50 * n^2 XP cumulative.
// Inverse: level = floor(sqrt(xp / 50))
export function xpForLevel(level: number): number {
  return 50 * level * level;
}

export const BADGE_DEFS = [
  { id: "streak-3", name: "Spark", desc: "3-day streak", icon: "🔥" },
  { id: "streak-7", name: "Week Warrior", desc: "7-day streak", icon: "⚔️" },
  { id: "streak-14", name: "Locked In", desc: "14-day streak", icon: "🔒" },
  { id: "streak-30", name: "Iron Discipline", desc: "30-day streak", icon: "🛡️" },
  { id: "streak-100", name: "Centurion", desc: "100-day streak", icon: "👑" },
  { id: "perfect-day", name: "Full Stack Day", desc: "All habits in one day", icon: "💯" },
  { id: "perfect-week", name: "Perfect Week", desc: "All habits 7 days running", icon: "🌟" },
  { id: "comeback", name: "Comeback Kid", desc: "Bounced back after a 0-day", icon: "💪" },
  { id: "hydrated", name: "Hydration God", desc: "Water 14 days running", icon: "🌊" },
  { id: "rested", name: "Well Rested", desc: "Sleep 7 nights in a row", icon: "🌙" },
];
