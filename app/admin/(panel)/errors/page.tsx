"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BugOff } from "lucide-react";

import { getErrors, queryKeys, type EngagementRange } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { timeAgo } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { ErrorKind } from "@/lib/admin/types";

const KIND_LABEL: Record<ErrorKind, string> = {
  JS_ERROR: "JS",
  UNHANDLED_REJECTION: "Promise",
  RESOURCE_ERROR: "Asset",
};

const KIND_STYLE: Record<ErrorKind, string> = {
  JS_ERROR: "border-red-500/25 bg-red-500/10 text-red-300",
  UNHANDLED_REJECTION: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  RESOURCE_ERROR: "border-sky-500/25 bg-sky-500/10 text-sky-300",
};

/**
 * Client-side errors, grouped by message+source. A broken image inside a
 * carousel can fire hundreds of times; a hundred identical rows would tell you
 * nothing the first one didn't, so identical errors collapse into a count.
 */
export default function ErrorsPage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.errors(range),
    queryFn: () => getErrors(range),
  });

  return (
    <div>
      <PageHeader
        title="Errors"
        subtitle="JavaScript errors, unhandled rejections and failed asset loads"
        actions={
          <>
            <RangeSelect value={range} onChange={setRange} layoutId="errors-range" />
            <ExportButton rows={data ?? []} filename={`errors-${range}`} />
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
            icon={BugOff}
            title="No errors recorded"
            description="Nothing has thrown in this window — which is the result you want."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Kind</Th>
                <Th>Message</Th>
                <Th>Source</Th>
                <Th>Page</Th>
                <Th>Browser</Th>
                <Th className="text-right">Count</Th>
                <Th className="text-right">Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((err) => (
                <Tr key={err.id}>
                  <Td>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        KIND_STYLE[err.kind]
                      )}
                    >
                      {KIND_LABEL[err.kind]}
                    </span>
                  </Td>
                  <Td className="max-w-[360px] truncate text-admin-fg" title={err.message}>
                    {err.message}
                  </Td>
                  <Td
                    className="max-w-[220px] truncate font-mono text-[11px]"
                    title={err.source}
                  >
                    {err.source || "—"}
                    {err.lineNo ? `:${err.lineNo}` : ""}
                  </Td>
                  <Td className="text-admin-muted">{err.path}</Td>
                  <Td className="text-admin-muted">
                    {err.browser} · {err.os}
                  </Td>
                  <Td className="text-right tabular-nums text-admin-fg">{err.count}</Td>
                  <Td className="text-right text-admin-muted">{timeAgo(err.lastSeen)}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
