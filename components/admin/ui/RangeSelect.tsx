"use client";

import { Segmented } from "./Segmented";
import type { EngagementRange } from "@/lib/admin/api";

const OPTIONS = [
  { value: "7d" as const, label: "7d" },
  { value: "30d" as const, label: "30d" },
  { value: "90d" as const, label: "90d" },
  { value: "all" as const, label: "All" },
];

/**
 * Window selector for the engagement dashboards. `layoutId` must be unique per
 * mounted instance — Framer Motion animates the pill between any two elements
 * sharing one, so a duplicate makes the highlight fly across the page.
 */
export function RangeSelect({
  value,
  onChange,
  layoutId,
}: {
  value: EngagementRange;
  onChange: (v: EngagementRange) => void;
  layoutId: string;
}) {
  return (
    <Segmented
      options={OPTIONS}
      value={value}
      onChange={onChange}
      layoutId={layoutId}
    />
  );
}
