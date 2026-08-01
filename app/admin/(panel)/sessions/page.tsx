"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Radio,
  Repeat,
  Timer,
  LogOut,
  Search,
  Play,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
} from "lucide-react";
import { getSessions, getSessionStats, queryKeys } from "@/lib/admin/api";
import type { DeviceType, SessionRow } from "@/lib/admin/types";
import { formatDuration, formatPercent, timeAgo } from "@/lib/admin/format";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { MiniStat, MiniStatSkeleton } from "@/components/admin/ui/MiniStat";
import { SessionStatusBadge, Badge } from "@/components/admin/ui/Badge";
import { TableWrap, Th, Td, Tr } from "@/components/admin/ui/Table";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { ReplayModal } from "@/components/admin/ReplayModal";
import { cn } from "@/lib/utils";

const DEVICE_ICON: Record<DeviceType, typeof Monitor> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
  SMART_TV: Tv,
};

function flag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions(),
    queryFn: getSessions,
    refetchInterval: 15_000, // live feel
  });
  const { data: stats } = useQuery({
    queryKey: queryKeys.sessionStats(),
    queryFn: getSessionStats,
    refetchInterval: 15_000,
  });

  const [search, setSearch] = useState("");
  const [device, setDevice] = useState<DeviceType | "ALL">("ALL");
  const [replay, setReplay] = useState<SessionRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sessions ?? []).filter((s) => {
      if (device !== "ALL" && s.device !== device) return false;
      if (!q) return true;
      return [s.id, s.visitorId, s.city, s.country, s.source, s.ip]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sessions, search, device]);

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="Every visitor session, with replay"
        actions={<ExportButton rows={filtered} filename="sessions" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {!stats ? (
          Array.from({ length: 5 }).map((_, i) => <MiniStatSkeleton key={i} />)
        ) : (
          <>
            <MiniStat label="Total Sessions" value={stats.total.toLocaleString("en-IN")} icon={Activity} />
            <MiniStat label="Live Visitors" value={stats.live} icon={Radio} accent="text-emerald-400" live />
            <MiniStat label="Returning" value={stats.returning} icon={Repeat} />
            <MiniStat label="Avg Duration" value={formatDuration(stats.avgDurationMs)} icon={Timer} />
            <MiniStat label="Bounce Rate" value={formatPercent(stats.bounceRate)} icon={LogOut} />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-admin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search session, visitor, city, IP…"
            className="w-full rounded-lg border border-admin-border bg-admin-card py-1.5 pl-8 pr-3 text-xs text-admin-fg outline-none placeholder:text-admin-muted focus:border-admin-accent"
          />
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-admin-border bg-admin-card p-0.5">
          {(["ALL", "DESKTOP", "MOBILE", "TABLET"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                device === d
                  ? "bg-admin-card-2 text-admin-fg"
                  : "text-admin-muted hover:text-admin-fg-2"
              )}
            >
              {d === "ALL" ? "All" : d.toLowerCase()}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-admin-muted">
          {filtered.length} sessions
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
          <EmptyState title="No sessions match your filters" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Session</Th>
                <Th>Visitor</Th>
                <Th>Location</Th>
                <Th>IP Address</Th>
                <Th>Device</Th>
                <Th>Source</Th>
                <Th className="text-right">Pages</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Scroll</Th>
                <Th>Engagement</Th>
                <Th>Status</Th>
                <Th className="text-right">Time</Th>
                <Th className="text-right">Replay</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const DeviceIcon = DEVICE_ICON[s.device];
                return (
                  <Tr key={s.id}>
                    <Td className="font-medium text-admin-fg">{s.id}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="tabular-nums">{s.visitorId}</span>
                        <Badge
                          className={
                            s.visitorType === "RETURNING"
                              ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
                              : "border-admin-border bg-admin-card-2 text-admin-muted"
                          }
                        >
                          {s.visitorType === "RETURNING" ? "Ret" : "New"}
                        </Badge>
                      </div>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <span>{flag(s.countryCode)}</span>
                        {s.city}
                      </span>
                    </Td>
                    <Td className="tabular-nums">{s.ip}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <DeviceIcon className="size-3.5 text-admin-muted" />
                        {s.os} · {s.browser}
                      </span>
                    </Td>
                    <Td>{s.source}</Td>
                    <Td className="text-right tabular-nums">{s.pageViews}</Td>
                    <Td className="text-right tabular-nums">
                      {formatDuration(s.durationMs)}
                    </Td>
                    <Td className="text-right tabular-nums">{s.maxScroll}%</Td>
                    <Td>
                      <div className="flex gap-1">
                        {s.ctaClicked ? (
                          <Badge className="border-admin-border bg-admin-card-2 text-admin-accent">
                            CTA
                          </Badge>
                        ) : null}
                        {s.formSubmitted ? (
                          <Badge className="border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
                            Lead
                          </Badge>
                        ) : s.formStarted ? (
                          <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-300">
                            Form
                          </Badge>
                        ) : null}
                      </div>
                    </Td>
                    <Td>
                      <SessionStatusBadge status={s.status} />
                    </Td>
                    <Td className="text-right text-admin-muted">
                      {timeAgo(s.visitTime)}
                    </Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => setReplay(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-admin-border bg-admin-card px-2 py-1 text-[11px] font-medium text-admin-fg-2 transition-colors hover:text-admin-fg"
                      >
                        <Play className="size-3" /> Watch
                      </button>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <ReplayModal session={replay} onClose={() => setReplay(null)} />
    </div>
  );
}
