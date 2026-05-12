"use client";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";

export function Tabs({
  tabs,
  initial = 0,
  children,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  initial?: number;
  children: (activeId: string) => ReactNode;
  onChange?: (id: string) => void;
}) {
  const [idx, setIdx] = useState(initial);
  const active = tabs[idx]?.id ?? tabs[0].id;
  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setIdx(i); onChange?.(t.id); }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              i === idx ? "bg-white/[0.08] text-white" : "text-white/55 hover:text-white",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
