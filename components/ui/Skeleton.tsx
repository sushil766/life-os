import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "shimmer rounded-xl bg-white/[0.04]",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-card">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-24 w-full" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2">
      <Skeleton className="h-5 w-5 rounded-md" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}
