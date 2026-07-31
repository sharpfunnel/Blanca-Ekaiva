import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

export function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
  live,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: string;
  live?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card px-4 py-3">
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon className={cn("size-3.5 text-admin-muted", accent)} /> : null}
        <span className="text-xs text-admin-muted">{label}</span>
        {live ? (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1.5 font-display text-xl font-semibold tracking-tight text-admin-fg",
          accent
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function MiniStatSkeleton() {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card px-4 py-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2.5 h-6 w-12" />
    </div>
  );
}
