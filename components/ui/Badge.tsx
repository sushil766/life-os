import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Tone = "default" | "emerald" | "violet" | "sky" | "amber" | "rose";

const tones: Record<Tone, string> = {
  default: "bg-white/[0.06] text-white/80 border-white/10",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/25",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
