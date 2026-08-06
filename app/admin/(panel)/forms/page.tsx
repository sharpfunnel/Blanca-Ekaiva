"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { getForms, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { formatNumber } from "@/lib/admin/format";

/**
 * One row per `data-form-id`. Completion rate (submits ÷ starts) is the number
 * that says whether a form works; view counts mostly say where it sits on the
 * page.
 */
export default function FormsPage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.forms(range),
    queryFn: () => getForms(range),
  });

  return (
    <div>
      <PageHeader
        title="Forms"
        subtitle="Views, starts, completions and where visitors give up"
        actions={
          <>
            <RangeSelect value={range} onChange={setRange} layoutId="forms-range" />
            <ExportButton rows={data ?? []} filename={`forms-${range}`} />
          </>
        }
      />

      <Card>
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-52 w-full" />
          </div>
        ) : !data?.length ? (
          <EmptyState
            icon={ClipboardList}
            title="No form data yet"
            description="Forms are tracked automatically; tag one with data-form-id to give it a stable name."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Form</Th>
                <Th className="text-right">Views</Th>
                <Th className="text-right">Starts</Th>
                <Th className="text-right">Start rate</Th>
                <Th className="text-right">Submits</Th>
                <Th className="text-right">Completion</Th>
                <Th className="text-right">Abandons</Th>
                <Th className="text-right">Errors</Th>
                <Th>Worst field</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((form) => (
                <Tr key={form.formId}>
                  <Td>
                    <span className="font-mono text-[11px] text-admin-fg">
                      {form.formId}
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{formatNumber(form.views)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(form.starts)}</Td>
                  <Td className="text-right tabular-nums">{form.startRate}%</Td>
                  <Td className="text-right tabular-nums text-admin-fg">
                    {formatNumber(form.submits)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    <span
                      className={
                        form.completionRate >= 60
                          ? "text-emerald-400"
                          : form.completionRate >= 30
                            ? "text-amber-400"
                            : "text-red-400"
                      }
                    >
                      {form.completionRate}%
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{formatNumber(form.abandons)}</Td>
                  <Td className="text-right tabular-nums">
                    {formatNumber(form.validationErrors)}
                  </Td>
                  <Td className="text-admin-muted">{form.worstField || "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <p className="mt-3 text-xs text-admin-muted">
        A form is &ldquo;started&rdquo; on first field focus and
        &ldquo;abandoned&rdquo; if the visitor leaves the page after starting
        without submitting. Only field <em>names</em> are recorded — never what
        anyone typed.
      </p>
    </div>
  );
}
