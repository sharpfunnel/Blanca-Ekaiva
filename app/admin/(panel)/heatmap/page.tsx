"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MousePointerClick,
  ArrowDownWideNarrow,
  Pointer,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { getHeatmap, queryKeys } from "@/lib/admin/api";
import { formatNumber } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { Segmented } from "@/components/admin/ui/Segmented";
import { BarList } from "@/components/admin/charts/BarList";
import { Badge } from "@/components/admin/ui/Badge";
import { ClickHeatmap, ScrollHeatmap } from "@/components/admin/HeatmapStage";
import { cn } from "@/lib/utils";

type Tab = "click" | "scroll" | "hover";
type Device = "desktop" | "tablet" | "mobile";

const TABS = [
  { value: "click" as const, label: "Click", icon: <MousePointerClick className="size-3.5" /> },
  { value: "scroll" as const, label: "Scroll", icon: <ArrowDownWideNarrow className="size-3.5" /> },
  { value: "hover" as const, label: "Hover", icon: <Pointer className="size-3.5" /> },
];

const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 720,
  tablet: 520,
  mobile: 360,
};

const LEGEND = [
  { label: "Low", color: "#3b82f6" },
  { label: "Medium", color: "#22c55e" },
  { label: "High", color: "#eab308" },
  { label: "Very High", color: "#f97316" },
  { label: "Highest", color: "#ef4444" },
];

export default function HeatmapPage() {
  const [tab, setTab] = useState<Tab>("click");
  const [device, setDevice] = useState<Device>("desktop");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.heatmap(),
    queryFn: getHeatmap,
  });

  const selectCls =
    "rounded-lg border border-admin-border bg-admin-card px-3 py-1.5 text-xs text-admin-fg-2 outline-none focus:border-admin-accent";

  return (
    <div>
      <PageHeader
        title="Heatmap"
        subtitle="Where visitors click, how far they scroll, what they hover"
        actions={
          <Segmented options={TABS} value={tab} onChange={setTab} layoutId="heat-tab" />
        }
      />

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className={selectCls} defaultValue="/">
          <option value="/">Landing Page — /</option>
          <option value="/thank-you">Thank You — /thank-you</option>
        </select>
        <select className={selectCls} defaultValue="7d">
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <select className={selectCls} defaultValue="all">
          <option value="all">All traffic sources</option>
          <option value="google">Google</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </select>
        <select className={selectCls} defaultValue="all">
          <option value="all">All countries</option>
          <option value="in">India</option>
          <option value="ae">UAE</option>
        </select>

        <div className="ml-auto inline-flex items-center gap-0.5 rounded-lg border border-admin-border bg-admin-card p-0.5">
          {([
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone],
          ] as const).map(([d, Icon]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-label={d}
              className={cn(
                "flex size-7 items-center justify-center rounded-md transition-colors",
                device === d
                  ? "bg-admin-card-2 text-admin-fg"
                  : "text-admin-muted hover:text-admin-fg-2"
              )}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* Stage */}
        <Card className="overflow-hidden p-4">
          {isLoading || !data ? (
            <Skeleton className="mx-auto h-[600px] w-full max-w-[720px]" />
          ) : tab === "click" ? (
            <ClickHeatmap points={data.points} frameWidth={DEVICE_WIDTH[device]} />
          ) : tab === "scroll" ? (
            <ScrollHeatmap buckets={data.scroll} frameWidth={DEVICE_WIDTH[device]} />
          ) : (
            <div className="mx-auto max-w-[720px] py-2">
              <p className="mb-3 text-sm text-admin-fg-2">
                Most-hovered elements
              </p>
              <BarList
                items={(data.hover ?? []).map((h) => ({
                  label: h.label,
                  value: h.hovers,
                  leading: (
                    <Badge className="border-admin-border bg-admin-card-2 text-admin-muted">
                      {h.kind}
                    </Badge>
                  ),
                }))}
                color="#a78bfa"
              />
            </div>
          )}
        </Card>

        {/* Side panel */}
        <div className="space-y-3">
          <Card className="p-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-admin-muted uppercase">
              Intensity Legend
            </p>
            <ul className="space-y-2">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-3 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${l.color}, ${l.color}55)`,
                      boxShadow: `0 0 8px ${l.color}aa`,
                    }}
                  />
                  <span className="text-admin-fg-2">{l.label} interaction</span>
                </li>
              ))}
            </ul>
          </Card>

          {tab === "click" && data ? (
            <Card className="p-4">
              <p className="mb-3 text-xs font-medium tracking-wide text-admin-muted uppercase">
                Top Clicked
              </p>
              <BarList
                items={[...data.points]
                  .sort((a, b) => b.clicks - a.clicks)
                  .filter(
                    (p, i, arr) =>
                      arr.findIndex((q) => q.label === p.label) === i
                  )
                  .slice(0, 6)
                  .map((p) => ({ label: p.label, value: p.clicks }))}
                color="#ef4444"
              />
            </Card>
          ) : null}

          {tab === "scroll" && data ? (
            <Card className="p-4">
              <p className="mb-3 text-xs font-medium tracking-wide text-admin-muted uppercase">
                Scroll Reach
              </p>
              <ul className="space-y-2.5">
                {data.scroll.map((b) => (
                  <li key={b.pct}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-admin-fg-2">{b.pct}% depth</span>
                      <span className="tabular-nums text-admin-fg">
                        {b.reached}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-admin-card-2">
                      <div
                        className="h-full rounded-full bg-admin-accent"
                        style={{ width: `${b.reached}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-4">
            <p className="text-xs text-admin-muted">
              {isLoading
                ? "Loading…"
                : `${formatNumber(
                    (data?.points ?? []).reduce((s, p) => s + p.clicks, 0)
                  )} interactions captured in this range.`}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
