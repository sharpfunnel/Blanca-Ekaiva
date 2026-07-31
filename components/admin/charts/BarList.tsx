"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/admin/format";

export interface BarListItem {
  label: string;
  value: number;
  hint?: string;
  leading?: React.ReactNode;
}

/** Horizontal ranked bars (PostHog-style) for distributions and top lists. */
export function BarList({
  items,
  color = "#c5a059",
}: {
  items: BarListItem[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        return (
          <li key={item.label} className="group relative">
            <div className="relative flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{ backgroundColor: color, opacity: 0.14 }}
              />
              <span className="relative flex min-w-0 items-center gap-2 text-[13px] text-admin-fg-2">
                {item.leading}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="relative flex shrink-0 items-center gap-2">
                {item.hint ? (
                  <span className="text-[11px] text-admin-muted">
                    {item.hint}
                  </span>
                ) : null}
                <span className="tabular-nums text-[13px] font-medium text-admin-fg">
                  {formatNumber(item.value)}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
