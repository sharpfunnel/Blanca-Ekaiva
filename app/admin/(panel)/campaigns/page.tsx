"use client";

import { Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Megaphone,
  RefreshCw,
  Link2,
  CircleAlert,
  ArrowUpRight,
} from "lucide-react";

import {
  getCampaigns,
  queryKeys,
  syncMetaNow,
  type EngagementRange,
} from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { RangeSelect } from "@/components/admin/ui/RangeSelect";
import { ExportButton } from "@/components/admin/ui/ExportButton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { formatNumber, timeAgo } from "@/lib/admin/format";

const money = (n: number, currency: string) =>
  `${currency === "INR" ? "₹" : ""}${formatNumber(Math.round(n))}`;

/**
 * Meta Ads spend beside the sessions and leads it actually produced.
 *
 * Everything left of "Sessions" is Meta's number; everything right of it is
 * ours. They routinely disagree — Meta counts an attributed result inside its
 * own attribution window, we count a row in our own database — and showing both
 * is more honest than picking one.
 */
export default function CampaignsPage() {
  const [range, setRange] = useState<EngagementRange>("30d");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.campaigns(range),
    queryFn: () => getCampaigns(range),
  });

  const account = data?.account;
  const campaigns = data?.campaigns ?? [];

  async function sync() {
    setSyncing(true);
    setSyncError(null);
    const result = await syncMetaNow().catch((e) => ({
      ok: false,
      error: (e as Error).message,
    }));
    if (!result.ok) setSyncError(result.error || "Sync failed.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    setSyncing(false);
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Meta Ads spend joined against the sessions and leads it produced"
        actions={
          <>
            <RangeSelect
              value={range}
              onChange={setRange}
              layoutId="campaigns-range"
            />
            {account?.connected ? (
              <button
                type="button"
                onClick={sync}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-lg border border-admin-border bg-admin-card px-2.5 py-1.5 text-xs font-medium text-admin-fg-2 transition-colors hover:text-admin-fg disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            ) : null}
            <ExportButton rows={campaigns} filename={`campaigns-${range}`} />
          </>
        }
      />

      {/* useSearchParams opts a route out of prerendering unless it sits under
          a Suspense boundary, and these two banners are the only thing on the
          page that needs the URL. */}
      <Suspense fallback={null}>
        <OAuthResultBanner />
      </Suspense>
      {syncError ? (
        <p className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <CircleAlert className="size-3.5 shrink-0" />
          {syncError}
        </p>
      ) : null}
      {account?.lastSyncError ? (
        <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <CircleAlert className="size-3.5 shrink-0" />
          Last sync failed: {account.lastSyncError}
        </p>
      ) : null}

      {isLoading ? (
        <Card>
          <div className="p-5">
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      ) : !account?.connected ? (
        <Card>
          <EmptyState
            icon={Link2}
            title="No ad account connected"
            description="Connect a Meta ad account to pull campaign spend, impressions and results into this panel."
          />
          <div className="flex justify-center pb-8">
            <a
              href="/api/meta/oauth/start"
              className="flex items-center gap-2 rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-black hover:bg-admin-accent-2"
            >
              <Link2 className="size-4" /> Connect Meta ad account
            </a>
          </div>
        </Card>
      ) : !campaigns.length ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No campaigns synced yet"
            description="The account is connected but nothing has been pulled. Run a sync, or wait for the nightly cron."
          />
        </Card>
      ) : (
        <Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th className="text-right">Spend</Th>
                <Th className="text-right">Impr.</Th>
                <Th className="text-right">Clicks</Th>
                <Th className="text-right">CTR</Th>
                <Th className="text-right">CPC</Th>
                <Th className="text-right">Results</Th>
                <Th className="text-right">Sessions</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Cost / lead</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <Tr key={c.campaignId}>
                  <Td className="max-w-[240px] truncate text-admin-fg" title={c.name}>
                    {c.name}
                  </Td>
                  <Td className="text-admin-muted">{c.status || "—"}</Td>
                  <Td className="text-right tabular-nums text-admin-fg">
                    {money(c.spend, c.currency)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {formatNumber(c.impressions)}
                  </Td>
                  <Td className="text-right tabular-nums">{formatNumber(c.clicks)}</Td>
                  <Td className="text-right tabular-nums">{c.ctr}%</Td>
                  <Td className="text-right tabular-nums">
                    {money(c.cpc, c.currency)}
                  </Td>
                  <Td className="text-right tabular-nums text-admin-muted">
                    {formatNumber(c.results)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {formatNumber(c.sessions)}
                  </Td>
                  <Td className="text-right tabular-nums text-admin-fg">
                    {formatNumber(c.leads)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {c.leads ? money(c.costPerLead, c.currency) : "—"}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/campaigns/${c.campaignId}`}
                      className="flex items-center gap-1 text-xs text-admin-accent hover:text-admin-accent-2"
                    >
                      Open <ArrowUpRight className="size-3" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {account?.connected ? (
        <p className="mt-3 text-xs text-admin-muted">
          Account {account.accountId} ({account.currency}) · last synced{" "}
          {account.lastSyncedAt ? timeAgo(account.lastSyncedAt) : "never"}.
          &ldquo;Results&rdquo; is Meta&rsquo;s attributed count;
          &ldquo;Leads&rdquo; is rows in our own database. They will not match.
        </p>
      ) : null}
    </div>
  );
}

/** Reports the outcome of the Meta OAuth round-trip, read from the callback's
 *  redirect params. */
function OAuthResultBanner() {
  const params = useSearchParams();
  const error = params.get("meta_error");
  const connected = params.get("meta_connected");

  if (error) {
    return (
      <p className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        <CircleAlert className="size-3.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (connected) {
    return (
      <p className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
        Ad account {connected} connected. Run a sync to pull campaigns.
      </p>
    );
  }
  return null;
}
