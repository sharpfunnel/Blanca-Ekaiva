"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge } from "lucide-react";

import { getPerformance, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { formatNumber } from "@/lib/admin/format";
import type { VitalStat } from "@/lib/admin/types";

/** What each metric measures, in one line, for whoever is reading the number. */
const DESCRIPTIONS: Record<string, string> = {
  LCP: "Largest Contentful Paint — when the main content finished rendering.",
  INP: "Interaction to Next Paint — how quickly the page responds to a tap.",
  CLS: "Cumulative Layout Shift — how much the page moves under the reader.",
  FCP: "First Contentful Paint — when anything first appeared.",
  TTFB: "Time to First Byte — how long the server took to respond.",
};

/** Google's "good" boundary, shown so a bare number means something. */
const GOOD_THRESHOLD: Record<string, string> = {
  LCP: "≤ 2.5s",
  INP: "≤ 200ms",
  CLS: "≤ 0.1",
  FCP: "≤ 1.8s",
  TTFB: "≤ 800ms",
};

function formatValue(v: VitalStat) {
  if (v.unit === "score") return v.p75.toFixed(3);
  return v.p75 >= 1000 ? `${(v.p75 / 1000).toFixed(2)}s` : `${v.p75}ms`;
}

export default function PerformancePage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.performance(range),
    queryFn: () => getPerformance(range),
  });

  const hasSamples = data?.some((v) => v.samples > 0);

  return (
    <div>
      <PageHeader
        title="Performance"
        subtitle="Core Web Vitals from real visitors, not a lab test"
        actions={
          <RangeSelect
            value={range}
            onChange={setRange}
            layoutId="performance-range"
          />
        }
      />

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : !hasSamples ? (
        <Card>
          <EmptyState
            icon={Gauge}
            title="No vitals captured yet"
            description="Metrics are reported when a visitor backgrounds or leaves the page, so the first ones arrive a minute or two after real traffic does."
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((vital) => {
            const total = vital.good + vital.needsImprovement + vital.poor;
            const pct = (n: number) => (total ? (n / total) * 100 : 0);
            return (
              <Card key={vital.name}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <Gauge className="size-4 text-admin-muted" />
                      {vital.name}
                    </span>
                  }
                  subtitle={DESCRIPTIONS[vital.name]}
                  action={
                    <span className="whitespace-nowrap text-[11px] text-admin-muted">
                      good {GOOD_THRESHOLD[vital.name]}
                    </span>
                  }
                />
                <div className="px-5 pb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold tracking-tight text-admin-fg tabular-nums">
                      {formatValue(vital)}
                    </span>
                    <span className="text-xs text-admin-muted">
                      p75 · {formatNumber(vital.samples)} samples
                    </span>
                  </div>

                  {/* Distribution, not an average: Google grades the 75th
                      percentile, and a mean hides a slow tail entirely. */}
                  <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-admin-card-2">
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${pct(vital.good)}%` }}
                    />
                    <div
                      className="bg-amber-500"
                      style={{ width: `${pct(vital.needsImprovement)}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${pct(vital.poor)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-admin-muted tabular-nums">
                    <span className="text-emerald-400">
                      {pct(vital.good).toFixed(0)}% good
                    </span>
                    <span className="text-amber-400">
                      {pct(vital.needsImprovement).toFixed(0)}% needs work
                    </span>
                    <span className="text-red-400">
                      {pct(vital.poor).toFixed(0)}% poor
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
