"use client";

import { motion } from "framer-motion";
import { formatNumber } from "@/lib/admin/format";
import type { FunnelStage } from "@/lib/admin/types";

export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const top = stages[0]?.count || 1;

  return (
    <ul className="space-y-2">
      {stages.map((stage, i) => {
        const pctOfTop = (stage.count / top) * 100;
        const prev = i > 0 ? stages[i - 1].count : stage.count;
        const stepPct = prev ? (stage.count / prev) * 100 : 100;
        const dropoff = 100 - stepPct;

        return (
          <li key={stage.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-admin-fg-2">
                <span className="mr-2 text-admin-muted tabular-nums">
                  {i + 1}
                </span>
                {stage.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular-nums font-medium text-admin-fg">
                  {formatNumber(stage.count)}
                </span>
                <span className="tabular-nums text-admin-muted">
                  {pctOfTop.toFixed(1)}%
                </span>
                {i > 0 && dropoff > 0.5 ? (
                  <span className="tabular-nums text-red-400/80">
                    −{dropoff.toFixed(0)}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-admin-card-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pctOfTop}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="h-full rounded-lg bg-gradient-to-r from-admin-accent/80 to-admin-accent"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
