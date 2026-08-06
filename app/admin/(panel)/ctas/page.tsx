"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MousePointerClick } from "lucide-react";

import { getCtas, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { formatNumber } from "@/lib/admin/format";

/**
 * One row per `data-cta-id`. Adding a CTA to this table is a markup change on
 * the landing page — tag the element and it appears here on its first view.
 */
export default function CtasPage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ctas(range),
    queryFn: () => getCtas(range),
  });

  return (
    <div>
      <PageHeader
        title="CTAs"
        subtitle="Every element tagged with data-cta-id, ranked by clicks"
        actions={
          <>
            <RangeSelect value={range} onChange={setRange} layoutId="ctas-range" />
            <ExportButton rows={data ?? []} filename={`ctas-${range}`} />
          </>
        }
      />

      <Card>
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={MousePointerClick}
            title="No CTA data yet"
            description="Tag a button or link with data-cta-id on the landing page and it will appear here."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>CTA</Th>
                <Th className="text-right">Views</Th>
                <Th className="text-right">Hovers</Th>
                <Th className="text-right">Clicks</Th>
                <Th className="text-right">CTR</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Conv. rate</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((cta) => (
                <Tr key={cta.ctaId}>
                  <Td className="max-w-[280px] truncate" title={cta.label}>
                    <span className="text-admin-fg">{cta.label}</span>
                    <span className="ml-2 rounded border border-admin-border bg-admin-card-2 px-1.5 py-0.5 font-mono text-[10px] text-admin-muted">
                      {cta.ctaId}
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{formatNumber(cta.views)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(cta.hovers)}</Td>
                  <Td className="text-right tabular-nums text-admin-fg">
                    {formatNumber(cta.clicks)}
                  </Td>
                  <Td className="text-right tabular-nums">{cta.ctr}%</Td>
                  <Td className="text-right tabular-nums">{formatNumber(cta.leads)}</Td>
                  <Td className="text-right tabular-nums">
                    <span
                      className={
                        cta.conversionRate >= 10
                          ? "text-emerald-400"
                          : cta.conversionRate > 0
                            ? "text-admin-fg-2"
                            : "text-admin-muted"
                      }
                    >
                      {cta.conversionRate}%
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <p className="mt-3 text-xs text-admin-muted">
        CTR is clicks ÷ views. Conversion rate is the share of sessions that
        clicked this CTA <em>and</em> went on to submit a lead — not a claim that
        the CTA caused the lead.
      </p>
    </div>
  );
}
