"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatCompact, formatNumber } from "@/lib/admin/format";
import type { TimePoint } from "@/lib/admin/types";
import { SERIES } from "./palette";

type SeriesKey = keyof typeof SERIES;
const SERIES_META: { key: SeriesKey; label: string }[] = [
  { key: "visitors", label: "Visitors" },
  { key: "sessions", label: "Sessions" },
  { key: "leads", label: "Leads" },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-admin-border bg-admin-card-2 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-admin-fg">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="capitalize text-admin-muted">{p.name}</span>
            <span className="ml-auto font-medium text-admin-fg">
              {formatNumber(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisitorsChart({ data }: { data: TimePoint[] }) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const toggle = (k: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3 px-1">
        {SERIES_META.map((s) => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-opacity",
                off ? "opacity-40" : "opacity-100"
              )}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: SERIES[s.key] }}
              />
              <span className="text-admin-fg-2">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {SERIES_META.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`grad-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={SERIES[s.key]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SERIES[s.key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#1e1e1e" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#7a7a7a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "#7a7a7a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompact(v as number)}
              width={44}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "#333", strokeWidth: 1 }}
            />
            {SERIES_META.filter((s) => !hidden.has(s.key)).map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={SERIES[s.key]}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                animationDuration={600}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
