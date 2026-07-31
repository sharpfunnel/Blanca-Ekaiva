"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMetric } from "@/lib/admin/format";
import type { Metric } from "@/lib/admin/types";
import { Skeleton } from "./Skeleton";

/** For most metrics, up = good. For bounce rate & avg-duration-drop, down = good. */
const LOWER_IS_BETTER = new Set(["bounce"]);

export function StatCard({
  metric,
  icon: Icon,
  index = 0,
}: {
  metric: Metric;
  icon: LucideIcon;
  index?: number;
}) {
  const positive = LOWER_IS_BETTER.has(metric.key)
    ? metric.trend === "down"
    : metric.trend === "up";

  const TrendIcon =
    metric.trend === "up"
      ? ArrowUpRight
      : metric.trend === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="rounded-2xl border border-admin-border bg-admin-card p-4 transition-colors hover:border-admin-border-2"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-8 items-center justify-center rounded-lg border border-admin-border bg-admin-card-2 text-admin-fg-2">
          <Icon className="size-4" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}
        >
          <TrendIcon className="size-3" />
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
      </div>
      <p className="mt-3 text-xs text-admin-muted">{metric.label}</p>
      <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-admin-fg">
        {formatMetric(metric.value, metric.format)}
      </p>
    </motion.div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="mt-3 h-3 w-24" />
      <Skeleton className="mt-2 h-7 w-20" />
    </div>
  );
}
