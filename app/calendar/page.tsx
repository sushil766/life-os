"use client";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Tabs } from "@/components/ui/Tabs";
import { WeeklyPlanner } from "@/components/calendar/WeeklyPlanner";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { DeadlineList } from "@/components/calendar/DeadlineList";
import { GoogleConnectCard } from "@/components/calendar/GoogleConnectCard";
import { Button } from "@/components/ui/Button";
import { EventDialog } from "@/components/calendar/EventDialog";
import { Plus } from "lucide-react";
import { todayKey } from "@/lib/utils";

export default function CalendarPage() {
  const [openAdd, setOpenAdd] = useState(false);
  return (
    <Hydrated>
      <PageHeader
        title="Calendar & planner"
        subtitle="Time-block your week, see deadlines at a glance."
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpenAdd(true)}>Add event</Button>}
      />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <Suspense fallback={null}><GoogleConnectCard /></Suspense>
        </div>
        <div className="col-span-12 lg:col-span-9">
          <Tabs tabs={[{ id: "week", label: "Week" }, { id: "month", label: "Month" }]}>
            {(id) => (id === "week" ? <WeeklyPlanner /> : <MonthlyCalendar />)}
          </Tabs>
        </div>
        <div className="col-span-12 lg:col-span-3"><DeadlineList /></div>
      </div>
      <EventDialog open={openAdd} onClose={() => setOpenAdd(false)} date={todayKey()} />
    </Hydrated>
  );
}
