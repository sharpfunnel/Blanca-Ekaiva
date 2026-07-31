"use client";

import { useState } from "react";
import type { HeatPoint, ScrollBucket } from "@/lib/admin/types";
import { formatDuration, formatNumber } from "@/lib/admin/format";

/** Interaction intensity → Clarity-style colour ramp. */
function heatColor(i: number): string {
  if (i < 0.25) return "#3b82f6"; // blue
  if (i < 0.5) return "#22c55e"; // green
  if (i < 0.7) return "#eab308"; // yellow
  if (i < 0.85) return "#f97316"; // orange
  return "#ef4444"; // red
}

/** A stand-in for the landing-page screenshot the overlays sit on. */
function PageMock() {
  return (
    <div className="space-y-4 p-5 opacity-[0.55]">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-admin-hover" />
        <div className="h-6 w-28 rounded-full bg-admin-hover" />
      </div>
      <div className="space-y-2 pt-8">
        <div className="h-8 w-3/4 rounded bg-admin-hover" />
        <div className="h-8 w-2/3 rounded bg-admin-hover" />
        <div className="h-4 w-1/2 rounded bg-admin-hover/70" />
        <div className="flex gap-2 pt-2">
          <div className="h-9 w-40 rounded-full bg-admin-hover" />
          <div className="h-9 w-32 rounded-full bg-admin-hover/70" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 pt-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-admin-hover" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-6">
        <div className="h-40 rounded-xl bg-admin-hover" />
        <div className="h-40 rounded-xl bg-admin-hover" />
      </div>
      <div className="grid grid-cols-4 gap-3 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-admin-hover" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-admin-hover" />
      <div className="mx-auto h-64 max-w-md rounded-xl bg-admin-hover" />
    </div>
  );
}

export function ClickHeatmap({
  points,
  frameWidth,
}: {
  points: HeatPoint[];
  frameWidth: number;
}) {
  const [hovered, setHovered] = useState<HeatPoint | null>(null);

  return (
    <div className="relative mx-auto" style={{ maxWidth: frameWidth }}>
      <div className="relative overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <PageMock />
        {/* Overlay */}
        <div className="absolute inset-0">
          {points.map((p, i) => {
            const color = heatColor(p.intensity);
            const size = 14 + p.intensity * 34;
            return (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${p.relX * 100}%`,
                  top: `${p.relY * 100}%`,
                  width: size,
                  height: size,
                  background: `radial-gradient(circle, ${color}cc 0%, ${color}66 45%, transparent 72%)`,
                  boxShadow: `0 0 ${size / 1.5}px ${color}aa`,
                }}
                aria-label={p.label}
              />
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hovered ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 w-56 -translate-x-1/2 rounded-xl border border-admin-border bg-admin-card-2 p-3 text-xs shadow-2xl">
          <p className="mb-2 font-medium text-admin-fg">{hovered.label}</p>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-admin-muted">Clicks</dt>
              <dd className="tabular-nums text-admin-fg">
                {formatNumber(hovered.clicks)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-admin-muted">Unique visitors</dt>
              <dd className="tabular-nums text-admin-fg">
                {formatNumber(hovered.visitors)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-admin-muted">Conversion</dt>
              <dd className="tabular-nums text-emerald-400">
                {hovered.conversion}%
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-admin-muted">Avg time before</dt>
              <dd className="tabular-nums text-admin-fg">
                {formatDuration(hovered.avgTimeMs)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export function ScrollHeatmap({
  buckets,
  frameWidth,
}: {
  buckets: ScrollBucket[];
  frameWidth: number;
}) {
  return (
    <div className="relative mx-auto" style={{ maxWidth: frameWidth }}>
      <div className="relative overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <PageMock />
        {/* Scroll bands: each 20% slice tinted by reach at its depth */}
        <div className="absolute inset-0 flex flex-col">
          {buckets.map((b, i) => {
            const reach = b.reached / 100;
            // warm where many reached, cool where few did
            const color =
              reach > 0.75
                ? "#ef4444"
                : reach > 0.55
                  ? "#f97316"
                  : reach > 0.35
                    ? "#eab308"
                    : "#3b82f6";
            return (
              <div
                key={i}
                className="relative flex-1 border-b border-white/5"
                style={{ background: `${color}`, opacity: 0.14 + reach * 0.26 }}
              >
                <span className="absolute left-3 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {b.pct}% depth · {b.reached}% reached
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
