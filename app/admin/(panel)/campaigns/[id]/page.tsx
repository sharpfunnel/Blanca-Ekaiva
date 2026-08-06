"use client";

import { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Layers, Image as ImageIcon } from "lucide-react";

import { getCampaign, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { formatNumber } from "@/lib/admin/format";
import type { CampaignChild } from "@/lib/admin/types";

const money = (n: number, currency: string) =>
  `${currency === "INR" ? "₹" : ""}${formatNumber(Math.round(n))}`;

/** Campaign → ad set → ad drill-down, with daily spend against daily leads. */
export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.campaign(`${id}:${range}`),
    queryFn: () => getCampaign(id, range),
  });

  const currency = data?.campaign.currency ?? "INR";

  const childTable = (title: string, icon: React.ReactNode, rows: CampaignChild[]) => (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
        }
      />
      {!rows.length ? (
        <EmptyState title={`No ${title.toLowerCase()} synced`} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th className="text-right">Spend</Th>
              <Th className="text-right">Impr.</Th>
              <Th className="text-right">Clicks</Th>
              <Th className="text-right">CTR</Th>
              <Th className="text-right">Results</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.id}>
                <Td className="max-w-[280px] truncate text-admin-fg" title={row.name}>
                  {row.name}
                </Td>
                <Td className="text-admin-muted">{row.status || "—"}</Td>
                <Td className="text-right tabular-nums text-admin-fg">
                  {money(row.spend, currency)}
                </Td>
                <Td className="text-right tabular-nums">
                  {formatNumber(row.impressions)}
                </Td>
                <Td className="text-right tabular-nums">{formatNumber(row.clicks)}</Td>
                <Td className="text-right tabular-nums">{row.ctr}%</Td>
                <Td className="text-right tabular-nums">{formatNumber(row.results)}</Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );

  if (isError) {
    return (
      <div>
        <PageHeader title="Campaign" />
        <Card>
          <EmptyState
            title="Campaign not found"
            description="It may not have been synced yet, or it falls outside the selected window."
          />
        </Card>
      </div>
    );
  }

  const maxSpend = Math.max(1, ...(data?.daily ?? []).map((d) => d.spend));

  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="mb-3 inline-flex items-center gap-1.5 text-xs text-admin-muted hover:text-admin-fg"
      >
        <ArrowLeft className="size-3.5" /> All campaigns
      </Link>

      <PageHeader
        title={data?.campaign.name ?? "Campaign"}
        subtitle={
          data
            ? `${data.campaign.objective || "—"} · ${data.campaign.status || "—"}`
            : undefined
        }
        actions={
          <RangeSelect value={range} onChange={setRange} layoutId="campaign-range" />
        }
      />

      {isLoading || !data ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Spend", money(data.campaign.spend, currency)],
              ["Clicks", formatNumber(data.campaign.clicks)],
              ["Leads (ours)", formatNumber(data.campaign.leads)],
              [
                "Cost / lead",
                data.campaign.leads ? money(data.campaign.costPerLead, currency) : "—",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-admin-border bg-admin-card p-4"
              >
                <p className="text-xs text-admin-muted">{label}</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-admin-fg tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Daily spend vs leads — the only pairing that says whether the
              money is working. */}
          <Card className="mt-3">
            <CardHeader
              title="Daily spend vs leads"
              subtitle="Bar height is spend; the dot is leads that day"
            />
            <div className="px-5 pb-5">
              {!data.daily.length ? (
                <EmptyState title="No daily insights in this window" />
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {data.daily.map((day) => (
                    <div
                      key={day.date}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      title={`${day.date} · ${money(day.spend, currency)} · ${day.leads} leads`}
                    >
                      {day.leads > 0 ? (
                        <span className="mb-1 size-1.5 rounded-full bg-emerald-400" />
                      ) : null}
                      <span
                        className="w-full rounded-t bg-admin-accent/70 transition-colors group-hover:bg-admin-accent"
                        style={{
                          height: `${Math.max(2, (day.spend / maxSpend) * 100)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="mt-3 space-y-3">
            {childTable(
              "Ad Sets",
              <Layers className="size-4 text-admin-muted" />,
              data.adSets
            )}
            {childTable(
              "Ads",
              <ImageIcon className="size-4 text-admin-muted" />,
              data.ads
            )}
          </div>
        </>
      )}
    </div>
  );
}
