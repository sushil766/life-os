"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ProgressBar({
  value,
  max = 100,
  className,
  color = "violet",
  showLabel = false,
}: {
  value: number;
  max?: number;
  className?: string;
  color?: "violet" | "emerald" | "sky" | "amber" | "rose";
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const grad: Record<string, string> = {
    violet: "from-violet-500 to-fuchsia-500",
    emerald: "from-emerald-400 to-teal-400",
    sky: "from-sky-400 to-cyan-400",
    amber: "from-amber-400 to-orange-400",
    rose: "from-rose-400 to-pink-400",
  };
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <motion.div
        className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", grad[color])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {showLabel && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/70">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 140,
  stroke = 12,
  label,
  sublabel,
  color = "#a78bfa",
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-3xl font-semibold tracking-tight text-white">{label}</span>}
        {sublabel && <span className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">{sublabel}</span>}
      </div>
    </div>
  );
}
