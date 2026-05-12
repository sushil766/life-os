"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { HabitTrendChart } from "@/components/habits/HabitTrendChart";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { BadgeShelf } from "@/components/habits/BadgeShelf";
import { RecoverySuggestions } from "@/components/habits/RecoverySuggestions";

export default function HabitsPage() {
  return (
    <Hydrated>
      <PageHeader title="Habits" subtitle="Consistency is the compounding interest of self-improvement." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8"><HabitHeatmap /></div>
        <div className="col-span-12 lg:col-span-4"><HabitTrendChart /></div>

        <div className="col-span-12"><HabitGrid /></div>

        <div className="col-span-12 lg:col-span-7"><BadgeShelf /></div>
        <div className="col-span-12 lg:col-span-5"><RecoverySuggestions /></div>
      </div>
    </Hydrated>
  );
}
