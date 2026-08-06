import "server-only";

import { prisma } from "@/lib/prisma";
import { GraphError, exchangeForLongLivedToken, graphGetAll } from "@/lib/meta/graph";

/**
 * Pulls Campaigns → Ad Sets → Ads → daily Insights from the Graph API and
 * upserts them into our own tables.
 *
 * Idempotent by design: every write is an upsert keyed on Meta's own id, so a
 * cron run that overlaps the previous one, or a manual re-run after a failure,
 * produces the same result rather than duplicates.
 */

/** Insights older than this are not re-fetched on a routine sync. */
const DEFAULT_LOOKBACK_DAYS = 30;

/** Refresh the token when it is within this window of expiring. */
const TOKEN_REFRESH_WINDOW_MS = 7 * 24 * 3600 * 1000;

export interface SyncResult {
  ok: boolean;
  campaigns: number;
  adSets: number;
  ads: number;
  insights: number;
  truncated: boolean;
  error?: string;
}

interface GraphCampaign {
  id: string;
  name: string;
  status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

interface GraphAdSet {
  id: string;
  name: string;
  status?: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
}

interface GraphAd {
  id: string;
  name: string;
  status?: string;
  adset_id: string;
  creative?: { thumbnail_url?: string };
}

interface GraphInsight {
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Meta reports many action types; a "result" here is a lead or a purchase. */
const RESULT_ACTIONS = new Set([
  "lead",
  "offsite_conversion.fb_pixel_lead",
  "onsite_conversion.lead_grouped",
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
]);

function resultsFrom(insight: GraphInsight) {
  const results = (insight.actions ?? [])
    .filter((a) => RESULT_ACTIONS.has(a.action_type))
    .reduce((sum, a) => sum + num(a.value), 0);
  const costs = (insight.cost_per_action_type ?? []).filter((a) =>
    RESULT_ACTIONS.has(a.action_type)
  );
  const costPerResult = costs.length ? num(costs[0].value) : 0;
  return { results: Math.round(results), costPerResult };
}

/** Keeps a long-lived token alive; returns the token to use for this run. */
async function ensureFreshToken(account: {
  accountId: string;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
}) {
  if (!account.accessToken) return null;
  const expiring =
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() - Date.now() < TOKEN_REFRESH_WINDOW_MS;
  if (!expiring) return account.accessToken;

  try {
    const fresh = await exchangeForLongLivedToken(account.accessToken);
    await prisma.metaAdAccount.update({
      where: { accountId: account.accountId },
      data: {
        accessToken: fresh.accessToken,
        tokenExpiresAt: fresh.expiresAt,
      },
    });
    return fresh.accessToken;
  } catch {
    // An expiring token still works today; a failed refresh is not a reason to
    // skip this run's data.
    return account.accessToken;
  }
}

export async function syncMetaAccount(
  accountId: string,
  lookbackDays = DEFAULT_LOOKBACK_DAYS
): Promise<SyncResult> {
  const empty: SyncResult = {
    ok: false,
    campaigns: 0,
    adSets: 0,
    ads: 0,
    insights: 0,
    truncated: false,
  };

  const account = await prisma.metaAdAccount.findUnique({ where: { accountId } });
  if (!account) return { ...empty, error: "Ad account is not connected." };

  const token = await ensureFreshToken(account);
  if (!token) return { ...empty, error: "No access token stored for this account." };

  const act = `act_${accountId}`;
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);
  const timeRange = JSON.stringify({
    since: since.toISOString().slice(0, 10),
    until: new Date().toISOString().slice(0, 10),
  });

  try {
    /* ── Campaigns ───────────────────────────────────────────────────────── */
    const campaigns = await graphGetAll<GraphCampaign>(
      `${act}/campaigns`,
      {
        fields:
          "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
      },
      token
    );

    for (const c of campaigns.rows) {
      const data = {
        accountId,
        name: c.name,
        status: c.status ?? null,
        objective: c.objective ?? null,
        // Meta reports budgets in minor units (paise for INR).
        dailyBudget: c.daily_budget ? num(c.daily_budget) / 100 : null,
        lifetimeBudget: c.lifetime_budget ? num(c.lifetime_budget) / 100 : null,
        startTime: c.start_time ? new Date(c.start_time) : null,
        stopTime: c.stop_time ? new Date(c.stop_time) : null,
      };
      await prisma.metaCampaign.upsert({
        where: { campaignId: c.id },
        create: { campaignId: c.id, ...data },
        update: data,
      });
    }

    /* ── Ad sets ─────────────────────────────────────────────────────────── */
    const adSets = await graphGetAll<GraphAdSet>(
      `${act}/adsets`,
      {
        fields:
          "id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal",
      },
      token
    );
    const knownCampaigns = new Set(campaigns.rows.map((c) => c.id));
    let adSetCount = 0;
    for (const s of adSets.rows) {
      // An ad set whose campaign was not returned would violate the FK; skip it
      // rather than fail the whole sync.
      if (!knownCampaigns.has(s.campaign_id)) continue;
      const data = {
        campaignId: s.campaign_id,
        name: s.name,
        status: s.status ?? null,
        dailyBudget: s.daily_budget ? num(s.daily_budget) / 100 : null,
        lifetimeBudget: s.lifetime_budget ? num(s.lifetime_budget) / 100 : null,
        optimizationGoal: s.optimization_goal ?? null,
      };
      await prisma.metaAdSet.upsert({
        where: { adSetId: s.id },
        create: { adSetId: s.id, ...data },
        update: data,
      });
      adSetCount += 1;
    }

    /* ── Ads ─────────────────────────────────────────────────────────────── */
    const ads = await graphGetAll<GraphAd>(
      `${act}/ads`,
      { fields: "id,name,status,adset_id,creative{thumbnail_url}" },
      token
    );
    const knownAdSets = new Set(
      adSets.rows.filter((s) => knownCampaigns.has(s.campaign_id)).map((s) => s.id)
    );
    let adCount = 0;
    for (const a of ads.rows) {
      if (!knownAdSets.has(a.adset_id)) continue;
      const data = {
        adSetId: a.adset_id,
        name: a.name,
        status: a.status ?? null,
        creativeThumbUrl: a.creative?.thumbnail_url ?? null,
      };
      await prisma.metaAd.upsert({
        where: { adId: a.id },
        create: { adId: a.id, ...data },
        update: data,
      });
      adCount += 1;
    }

    /* ── Daily insights, one pass per level ──────────────────────────────── */
    let insightCount = 0;
    for (const level of ["campaign", "adset", "ad"] as const) {
      const insights = await graphGetAll<GraphInsight & Record<string, string>>(
        `${act}/insights`,
        {
          level,
          time_range: timeRange,
          time_increment: "1",
          fields:
            "campaign_id,adset_id,ad_id,date_start,spend,impressions,clicks,reach,ctr,cpc,cpm,actions,cost_per_action_type",
        },
        token,
        40
      );

      for (const row of insights.rows) {
        const entityId =
          level === "campaign"
            ? row.campaign_id
            : level === "adset"
              ? row.adset_id
              : row.ad_id;
        if (!entityId) continue;

        const { results, costPerResult } = resultsFrom(row);
        const date = new Date(`${row.date_start}T00:00:00.000Z`);
        const data = {
          // Only campaign-level rows carry the relation, so the campaign pages
          // can join without a second lookup.
          campaignId:
            level === "campaign" && knownCampaigns.has(entityId) ? entityId : null,
          spend: num(row.spend),
          impressions: Math.round(num(row.impressions)),
          clicks: Math.round(num(row.clicks)),
          reach: Math.round(num(row.reach)),
          ctr: num(row.ctr),
          cpc: num(row.cpc),
          cpm: num(row.cpm),
          results,
          costPerResult,
        };
        await prisma.metaInsight.upsert({
          where: { level_entityId_date: { level, entityId, date } },
          create: { level, entityId, date, ...data },
          update: data,
        });
        insightCount += 1;
      }
    }

    await prisma.metaAdAccount.update({
      where: { accountId },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });

    return {
      ok: true,
      campaigns: campaigns.rows.length,
      adSets: adSetCount,
      ads: adCount,
      insights: insightCount,
      truncated: campaigns.truncated || adSets.truncated || ads.truncated,
    };
  } catch (e) {
    const message =
      e instanceof GraphError ? `Graph API: ${e.message}` : (e as Error).message;
    await prisma.metaAdAccount.update({
      where: { accountId },
      data: { lastSyncError: message.slice(0, 500) },
    });
    return { ...empty, error: message };
  }
}

/** Syncs every connected account; used by the cron route. */
export async function syncAllMetaAccounts(lookbackDays?: number) {
  const accounts = await prisma.metaAdAccount.findMany({
    where: { accessToken: { not: null } },
    select: { accountId: true },
  });
  const results: (SyncResult & { accountId: string })[] = [];
  for (const account of accounts) {
    results.push({
      accountId: account.accountId,
      ...(await syncMetaAccount(account.accountId, lookbackDays)),
    });
  }
  return results;
}
