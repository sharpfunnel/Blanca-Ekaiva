"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/lib/admin/format";
import type { Distribution } from "@/lib/admin/types";
import { CHART_COLORS } from "./palette";

export function DonutChart({
  data,
  centerLabel,
}: {
  data: Distribution[];
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={44}
              outerRadius={62}
              paddingAngle={2}
              stroke="none"
              animationDuration={600}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-lg font-semibold text-admin-fg">
            {formatNumber(total)}
          </span>
          {centerLabel ? (
            <span className="text-[10px] text-admin-muted">{centerLabel}</span>
          ) : null}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => {
          const pct = total ? (d.value / total) * 100 : 0;
          return (
            <li key={d.label} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-admin-fg-2">{d.label}</span>
              <span className="ml-auto shrink-0 tabular-nums text-admin-muted">
                {pct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
