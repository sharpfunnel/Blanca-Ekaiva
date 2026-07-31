"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  Activity,
  UserPlus,
  Percent,
  ArrowDownWideNarrow,
  MousePointerClick,
  Timer,
  LogOut,
  Repeat,
  Sparkles,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { getOverview, queryKeys } from "@/lib/admin/api";
import type { DateRange } from "@/lib/admin/types";
import {
  formatDuration,
  formatNumber,
  formatPercent,
  timeAgo,
} from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatCard, StatCardSkeleton } from "@/components/admin/ui/StatCard";
import { Segmented } from "@/components/admin/ui/Segmented";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { LeadStatusBadge } from "@/components/admin/ui/Badge";
import { TableWrap, Th, Td, Tr } from "@/components/admin/ui/Table";
import { VisitorsChart } from "@/components/admin/charts/VisitorsChart";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { BarList } from "@/components/admin/charts/BarList";
import { Funnel } from "@/components/admin/charts/Funnel";

const METRIC_ICONS: Record<string, LucideIcon> = {
  visitors: Users,
  sessions: Activity,
  leads: UserPlus,
  cvr: Percent,
  scroll: ArrowDownWideNarrow,
  cta: MousePointerClick,
  avgdur: Timer,
  bounce: LogOut,
  returning: Repeat,
  new: Sparkles,
};

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
] as const;

export default function OverviewPage() {
  const [range, setRange] = useState<DateRange>("7d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.overview(range),
    queryFn: () => getOverview(range),
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Real-time performance of your landing page"
        actions={
          <>
            <Segmented
              options={RANGE_OPTIONS.map((o) => ({ ...o }))}
              value={range}
              onChange={(v) => setRange(v)}
              layoutId="range"
            />
            <ExportButton
              rows={data?.sources ?? []}
              filename={`overview-${range}`}
            />
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {isLoading || !data
          ? Array.from({ length: 10 }).map((_, i) => <StatCardSkeleton key={i} />)
          : data.metrics.map((m, i) => (
              <StatCard
                key={m.key}
                metric={m}
                icon={METRIC_ICONS[m.key] ?? Activity}
                index={i}
              />
            ))}
      </div>

      {/* Chart + device donut */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Visitors Analytics"
            subtitle="Visitors, sessions and leads over time"
          />
          <div className="px-3 pb-4">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <VisitorsChart data={data.timeseries} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Device Distribution" />
          <div className="px-5 pb-5">
            {isLoading || !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <DonutChart data={data.devices} centerLabel="visitors" />
            )}
          </div>
        </Card>
      </div>

      {/* Funnel + traffic sources */}
      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Conversion Funnel"
            subtitle="Visitor → lead journey"
          />
          <div className="px-5 pb-5">
            {isLoading || !data ? (
              <div className="space-y-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Funnel stages={data.funnel} />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Traffic Sources"
            subtitle="Where your leads come from"
          />
          {isLoading || !data ? (
            <div className="space-y-2 px-5 pb-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Medium</Th>
                  <Th>Campaign</Th>
                  <Th className="text-right">Sessions</Th>
                  <Th className="text-right">Leads</Th>
                  <Th className="text-right">Conv.</Th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => {
                  const cvr = (s.leads / s.sessions) * 100;
                  return (
                    <Tr key={`${s.source}-${s.campaign}`}>
                      <Td className="font-medium text-admin-fg">{s.source}</Td>
                      <Td>{s.medium}</Td>
                      <Td className="max-w-[160px] truncate">{s.campaign}</Td>
                      <Td className="text-right tabular-nums">
                        {formatNumber(s.sessions)}
                      </Td>
                      <Td className="text-right tabular-nums">{s.leads}</Td>
                      <Td className="text-right tabular-nums text-emerald-400">
                        {formatPercent(cvr)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>

      {/* Browser + countries + top pages */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader title="Browsers" />
          <div className="px-5 pb-5">
            {isLoading || !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <DonutChart data={data.browsers} centerLabel="visitors" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Countries" />
          <div className="px-4 pb-4">
            {isLoading || !data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                items={data.countries.map((c) => ({
                  label: c.label,
                  value: c.value,
                  leading: <span className="text-sm">{flag(c.code)}</span>,
                }))}
                color="#60a5fa"
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top Pages" />
          <div className="px-4 pb-4">
            {isLoading || !data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                items={data.topPages.map((p) => ({
                  label: p.title,
                  value: p.views,
                  hint: formatDuration(p.avgTimeMs),
                }))}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Recent leads */}
      <div className="mt-3">
        <Card>
          <CardHeader
            title="Recent Leads"
            subtitle="Latest 10 form submissions"
            action={
              <Link
                href="/admin/leads"
                className="flex items-center gap-1 text-xs font-medium text-admin-accent hover:text-admin-accent-2"
              >
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          {isLoading || !data ? (
            <div className="space-y-2 px-5 pb-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Interest</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Time</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentLeads.map((l) => (
                  <Tr key={l.id}>
                    <Td className="font-medium text-admin-fg">{l.name}</Td>
                    <Td className="tabular-nums">{l.phone}</Td>
                    <Td>{l.interest}</Td>
                    <Td>{l.source}</Td>
                    <Td>
                      <LeadStatusBadge status={l.status} />
                    </Td>
                    <Td className="text-right text-admin-muted">
                      {timeAgo(l.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Country-code → emoji flag. */
function flag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
