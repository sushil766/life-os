import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  children,
  className,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 shadow-card",
        glow && "card-glow",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  icon,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04] text-white/80">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
