"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, FileType, Download } from "lucide-react";

import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import type { EngagementRange } from "@/lib/admin/api";

const REPORTS = [
  {
    kind: "overview",
    label: "Overview",
    description: "Daily visitors, sessions, leads, conversion and bounce rate.",
  },
  {
    kind: "leads",
    label: "Leads",
    description:
      "Every enquiry with contact details, source, campaign and status.",
  },
  {
    kind: "campaigns",
    label: "Campaigns",
    description:
      "Meta Ads spend beside the sessions and leads each campaign produced.",
  },
] as const;

const FORMATS = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", icon: FileType },
] as const;

/**
 * Date-ranged exports. Each button is a plain link to /api/reports/… — the
 * browser's own download handling beats anything built with fetch and a Blob,
 * and it means a slow PDF never blocks the page.
 */
export default function ReportsPage() {
  const [range, setRange] = useState<EngagementRange>("30d");

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Download the panel's data for a date range"
        actions={
          <RangeSelect value={range} onChange={setRange} layoutId="reports-range" />
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.kind}>
            <CardHeader title={report.label} subtitle={report.description} />
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              {FORMATS.map((format) => (
                <a
                  key={format.value}
                  href={`/api/reports/${report.kind}?format=${format.value}&range=${range}`}
                  className="flex items-center gap-1.5 rounded-lg border border-admin-border bg-admin-card-2 px-2.5 py-1.5 text-xs font-medium text-admin-fg-2 transition-colors hover:text-admin-fg"
                >
                  <format.icon className="size-3.5" />
                  {format.label}
                </a>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-admin-muted">
        <Download className="mt-0.5 size-3.5 shrink-0" />
        Exports are generated on demand and never cached. The Leads report
        contains personal contact details — treat the downloaded file the same
        way you would treat access to this panel.
      </p>
    </div>
  );
}
