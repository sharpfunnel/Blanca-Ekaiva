"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Renders the REAL landing page as the heatmap backdrop via a same-origin
 * iframe (?heatmap=1 disables tracking inside it), then overlays interaction
 * dots on top. Reveal animations are forced visible and the page height is
 * measured so relative (0..1) coordinates map onto the actual layout.
 */
function PageCanvas({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1600);

  // The embedded page reports its real height (works even cross-origin).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { type?: string; height?: number } | null;
      if (d?.type === "blanca-heatmap-height" && typeof d.height === "number" && d.height > 0) {
        setHeight(d.height);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const onLoad = useCallback(() => {
    const iframe = ref.current;
    try {
      const doc = iframe?.contentDocument;
      if (!doc) return;
      // Force scroll-reveal content visible and kill animations/scrolling.
      const style = doc.createElement("style");
      style.textContent =
        ".reveal,.word{opacity:1!important;transform:none!important}" +
        "*{animation:none!important;transition:none!important}" +
        "html{scroll-behavior:auto!important;overflow:hidden!important}";
      doc.head.appendChild(style);
      const measure = () => {
        const h = Math.max(
          doc.body?.scrollHeight ?? 0,
          doc.documentElement?.scrollHeight ?? 0
        );
        if (h > 0) setHeight(h);
      };
      measure();
      // Re-measure after images/fonts settle so late layout shifts are caught.
      setTimeout(measure, 500);
      setTimeout(measure, 1500);
    } catch {
      /* same-origin, but stay defensive */
    }
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-admin-border bg-white">
      <iframe
        ref={ref}
        src="/?heatmap=1"
        title="Landing page preview"
        scrolling="no"
        onLoad={onLoad}
        style={{
          width: "100%",
          height,
          border: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div className="absolute inset-0">{children}</div>
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
    <div className="relative mx-auto w-full" style={{ maxWidth: frameWidth }}>
      <PageCanvas>
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
      </PageCanvas>

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
    <div className="relative mx-auto w-full" style={{ maxWidth: frameWidth }}>
      <PageCanvas>
        <div className="flex h-full flex-col">
          {buckets.map((b, i) => {
            const reach = b.reached / 100;
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
                className="relative flex-1 border-b border-white/10"
                style={{ background: color, opacity: 0.16 + reach * 0.24 }}
              >
                <span className="absolute left-3 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {b.pct}% depth · {b.reached}% reached
                </span>
              </div>
            );
          })}
        </div>
      </PageCanvas>
    </div>
  );
}
