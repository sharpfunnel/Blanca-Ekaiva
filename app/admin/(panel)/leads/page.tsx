"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CalendarClock,
  BadgeCheck,
  Trophy,
  XCircle,
  Percent,
  Search,
} from "lucide-react";
import { getLeads, getLeadStats, queryKeys } from "@/lib/admin/api";
import type { Lead, LeadStatus } from "@/lib/admin/types";
import { formatPercent, timeAgo } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { MiniStat, MiniStatSkeleton } from "@/components/admin/ui/MiniStat";
import { LeadStatusBadge } from "@/components/admin/ui/Badge";
import { TableWrap, Th, Td, Tr } from "@/components/admin/ui/Table";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { LeadDrawer } from "@/components/admin/LeadDrawer";

const STATUS_FILTERS: { value: LeadStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "INTERESTED", label: "Interested" },
  { value: "SITE_VISIT_SCHEDULED", label: "Site Visit" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
  { value: "SPAM", label: "Spam" },
];

export default function LeadsPage() {
  const { data: leads, isLoading } = useQuery({
    queryKey: queryKeys.leads(),
    queryFn: getLeads,
  });
  const { data: stats } = useQuery({
    queryKey: queryKeys.leadStats(),
    queryFn: getLeadStats,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "ALL">("ALL");
  const [source, setSource] = useState("ALL");
  const [active, setActive] = useState<Lead | null>(null);

  const sources = useMemo(
    () => Array.from(new Set((leads ?? []).map((l) => l.source))),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (status !== "ALL" && l.status !== status) return false;
      if (source !== "ALL" && l.source !== source) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.city, l.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, search, status, source]);

  const selectCls =
    "rounded-lg border border-admin-border bg-admin-card px-3 py-1.5 text-xs text-admin-fg-2 outline-none focus:border-admin-accent";

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Lightweight CRM for every form submission"
        actions={<ExportButton rows={filtered} filename="leads" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {!stats
          ? Array.from({ length: 6 }).map((_, i) => <MiniStatSkeleton key={i} />)
          : [
              { label: "Total Leads", value: stats.total, icon: Users },
              { label: "Today", value: stats.today, icon: CalendarClock },
              { label: "Qualified", value: stats.qualified, icon: BadgeCheck },
              { label: "Won", value: stats.won, icon: Trophy, accent: "text-emerald-400" },
              { label: "Lost", value: stats.lost, icon: XCircle, accent: "text-red-400" },
              { label: "Conv. Rate", value: formatPercent(stats.conversionRate), icon: Percent },
            ].map((s) => (
              <MiniStat
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                accent={s.accent}
              />
            ))}
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-admin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, city…"
            className="w-full rounded-lg border border-admin-border bg-admin-card py-1.5 pl-8 pr-3 text-xs text-admin-fg outline-none placeholder:text-admin-muted focus:border-admin-accent"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus | "ALL")}
          className={selectCls}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={selectCls}
        >
          <option value="ALL">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-admin-muted">
          {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      {/* Table */}
      <Card className="mt-3 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No leads match your filters"
            description="Try clearing the search or switching the status filter."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Lead</Th>
                <Th>Phone</Th>
                <Th>Interest</Th>
                <Th>Budget</Th>
                <Th>City</Th>
                <Th>Source</Th>
                <Th>Device</Th>
                <Th>Status</Th>
                <Th className="text-right">Created</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <Tr key={l.id} onClick={() => setActive(l)}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-medium text-admin-fg">{l.name}</span>
                      <span className="text-[11px] text-admin-muted">{l.id}</span>
                    </div>
                  </Td>
                  <Td className="tabular-nums">{l.phone}</Td>
                  <Td>{l.interest}</Td>
                  <Td>{l.budget}</Td>
                  <Td>{l.city}</Td>
                  <Td>{l.source}</Td>
                  <Td>{l.device}</Td>
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

      <LeadDrawer lead={active} onClose={() => setActive(null)} />
    </div>
  );
}
