"use client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { DailyScoreRing } from "@/components/dashboard/DailyScoreRing";
import { XPBar } from "@/components/dashboard/XPBar";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { HabitChecklist } from "@/components/dashboard/HabitChecklist";
import { MotivationCard } from "@/components/dashboard/MotivationCard";
import { PlanMyDayCard } from "@/components/dashboard/PlanMyDayCard";
import { ReflectionCard } from "@/components/dashboard/ReflectionCard";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";

export default function DailyDashboardPage() {
  return (
    <Hydrated fallback={<div className="text-sm text-white/40">Loading your dashboard…</div>}>
      <PageHeader
        title="Daily dashboard"
        subtitle="One screen. Everything that matters today."
      />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3"><DailyScoreRing /></div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-4"><XPBar /></div>
        <div className="col-span-12 lg:col-span-5"><StreakCard /></div>

        <div className="col-span-12 lg:col-span-7"><HabitChecklist /></div>
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4"><MotivationCard /><UpcomingCard /></div>

        <div className="col-span-12 lg:col-span-7"><PlanMyDayCard /></div>
        <div className="col-span-12 lg:col-span-5"><ReflectionCard /></div>

        <div className="col-span-12"><TodayTasks /></div>
      </div>
    </Hydrated>
  );
}
