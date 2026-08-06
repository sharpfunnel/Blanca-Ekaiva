"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Megaphone } from "lucide-react";

import { getFunnels, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { Funnel } from "@/components/admin/charts/Funnel";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { formatNumber } from "@/lib/admin/format";
import type { FunnelStage } from "@/lib/admin/types";

/**
 * Page View → Scroll 25%+ → CTA Click → Form Start → Lead Submit, all traffic
 * beside Meta-ads-only. Seeing them side by side is the whole point: an ad
 * audience that scrolls but never clicks a CTA is a creative problem, while one
 * that clicks but never starts the form is a landing-page problem.
 */
export default function FunnelsPage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.funnels(range),
    queryFn: () => getFunnels(range),
  });

  const panel = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    stages: FunnelStage[] | undefined
  ) => (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        }
        subtitle={subtitle}
        action={
          stages?.length ? (
            <span className="rounded-full border border-admin-border bg-admin-card-2 px-2 py-0.5 text-[11px] text-admin-fg-2">
              {formatNumber(stages[stages.length - 1]?.count ?? 0)} leads
            </span>
          ) : null
        }
      />
      <div className="px-5 pb-5">
        {isLoading || !stages ? (
          <Skeleton className="h-56 w-full" />
        ) : stages[0]?.count === 0 ? (
          <EmptyState
            title="No sessions in this window"
            description="Nothing has been captured for this range yet."
          />
        ) : (
          <Funnel stages={stages} />
        )}
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Funnels"
        subtitle="Where visitors drop out on the way to becoming a lead"
        actions={
          <RangeSelect value={range} onChange={setRange} layoutId="funnels-range" />
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {panel(
          "All traffic",
          "Every session in the window",
          <Filter className="size-4 text-admin-muted" />,
          data?.all
        )}
        {panel(
          "Meta ads only",
          "Sessions carrying an fbclid or Meta campaign id",
          <Megaphone className="size-4 text-admin-muted" />,
          data?.meta
        )}
      </div>
    </div>
  );
}
