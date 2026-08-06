import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  CampaignChild,
  CampaignDetail,
  CampaignRow,
  CapiDelivery,
  MetaAccountStatus,
} from "@/lib/admin/types";
import type { EngagementRange } from "@/lib/admin/server/engagement";
import { since } from "@/lib/admin/server/engagement";

/**
 * Reads for /admin/campaigns and /admin/meta-capi.
 *
 * The interesting half is the join: Meta reports spend, we know which sessions
 * and leads carry that campaign id. Neither number means much alone — cost per
 * lead only exists when both sit in the same row.
 */

const rate = (n: number, d: number) => (d > 0 ? +(n / d).toFixed(2) : 0);

export async function metaAccountStatus(): Promise<MetaAccountStatus> {
  const account = await prisma.metaAdAccount.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!account) {
    return {
      connected: false,
      accountId: "",
      name: "",
      currency: "",
      lastSyncedAt: null,
      lastSyncError: null,
      tokenExpiresAt: null,
    };
  }
  return {
    // "Connected" means a usable token, not merely a row.
    connected: Boolean(account.accessToken),
    accountId: account.accountId,
    name: account.name || "",
    currency: account.currency || "INR",
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: account.lastSyncError ?? null,
    tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
  };
}

export async function campaignRows(
  range: EngagementRange
): Promise<CampaignRow[]> {
  const from = since(range);
  const [campaigns, insights, account] = await Promise.all([
    prisma.metaCampaign.findMany({ orderBy: { name: "asc" } }),
    prisma.metaInsight.findMany({
      where: { level: "campaign", ...(from ? { date: { gte: from } } : {}) },
      select: {
        entityId: true,
        spend: true,
        impressions: true,
        clicks: true,
        results: true,
      },
    }),
    prisma.metaAdAccount.findFirst({ select: { currency: true } }),
  ]);

  const totals = new Map<
    string,
    { spend: number; impressions: number; clicks: number; results: number }
  >();
  for (const row of insights) {
    const acc = totals.get(row.entityId) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      results: 0,
    };
    acc.spend += row.spend;
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.results += row.results;
    totals.set(row.entityId, acc);
  }

  // Our own side of the join.
  const sessions = await prisma.session.groupBy({
    by: ["metaCampaignId"],
    where: {
      metaCampaignId: { not: null },
      ...(from ? { startedAt: { gte: from } } : {}),
    },
    _count: { _all: true },
  });
  const sessionCounts = new Map(
    sessions.map((s) => [s.metaCampaignId ?? "", s._count._all])
  );

  const leadRows = await prisma.lead.findMany({
    where: {
      session: { metaCampaignId: { not: null } },
      ...(from ? { createdAt: { gte: from } } : {}),
    },
    select: { session: { select: { metaCampaignId: true } } },
  });
  const leadCounts = new Map<string, number>();
  for (const lead of leadRows) {
    const id = lead.session?.metaCampaignId;
    if (!id) continue;
    leadCounts.set(id, (leadCounts.get(id) ?? 0) + 1);
  }

  const currency = account?.currency || "INR";

  return campaigns.map((c) => {
    const t = totals.get(c.campaignId) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      results: 0,
    };
    const leads = leadCounts.get(c.campaignId) ?? 0;
    return {
      campaignId: c.campaignId,
      name: c.name,
      status: c.status || "",
      objective: c.objective || "",
      spend: +t.spend.toFixed(2),
      impressions: t.impressions,
      clicks: t.clicks,
      ctr: t.impressions ? +((t.clicks / t.impressions) * 100).toFixed(2) : 0,
      cpc: rate(t.spend, t.clicks),
      cpm: t.impressions ? +((t.spend / t.impressions) * 1000).toFixed(2) : 0,
      results: t.results,
      costPerResult: rate(t.spend, t.results),
      sessions: sessionCounts.get(c.campaignId) ?? 0,
      leads,
      // Cost per lead from OUR leads, not Meta's attributed results — the two
      // disagree often, and this one is the number the business actually pays.
      costPerLead: rate(t.spend, leads),
      currency,
    };
  });
}

export async function campaignDetail(
  campaignId: string,
  range: EngagementRange
): Promise<CampaignDetail | null> {
  const rows = await campaignRows(range);
  const campaign = rows.find((r) => r.campaignId === campaignId);
  if (!campaign) return null;

  const from = since(range);
  const dateFilter = from ? { date: { gte: from } } : {};

  const [adSets, ads, daily] = await Promise.all([
    prisma.metaAdSet.findMany({ where: { campaignId } }),
    prisma.metaAd.findMany({
      where: { adSet: { campaignId } },
      select: { adId: true, name: true, status: true },
    }),
    prisma.metaInsight.findMany({
      where: { level: "campaign", entityId: campaignId, ...dateFilter },
      orderBy: { date: "asc" },
      select: { date: true, spend: true, clicks: true },
    }),
  ]);

  const childInsights = await prisma.metaInsight.findMany({
    where: {
      level: { in: ["adset", "ad"] },
      entityId: { in: [...adSets.map((s) => s.adSetId), ...ads.map((a) => a.adId)] },
      ...dateFilter,
    },
    select: {
      entityId: true,
      spend: true,
      impressions: true,
      clicks: true,
      results: true,
    },
  });

  const totals = new Map<
    string,
    { spend: number; impressions: number; clicks: number; results: number }
  >();
  for (const row of childInsights) {
    const acc = totals.get(row.entityId) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      results: 0,
    };
    acc.spend += row.spend;
    acc.impressions += row.impressions;
    acc.clicks += row.clicks;
    acc.results += row.results;
    totals.set(row.entityId, acc);
  }

  const toChild = (id: string, name: string, status: string): CampaignChild => {
    const t = totals.get(id) ?? { spend: 0, impressions: 0, clicks: 0, results: 0 };
    return {
      id,
      name,
      status,
      spend: +t.spend.toFixed(2),
      impressions: t.impressions,
      clicks: t.clicks,
      ctr: t.impressions ? +((t.clicks / t.impressions) * 100).toFixed(2) : 0,
      cpc: rate(t.spend, t.clicks),
      results: t.results,
    };
  };

  // Leads per day for this campaign, to sit alongside daily spend.
  const leadDates = await prisma.lead.findMany({
    where: {
      session: { metaCampaignId: campaignId },
      ...(from ? { createdAt: { gte: from } } : {}),
    },
    select: { createdAt: true },
  });
  const leadsByDay = new Map<string, number>();
  for (const lead of leadDates) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    leadsByDay.set(key, (leadsByDay.get(key) ?? 0) + 1);
  }

  return {
    campaign,
    adSets: adSets
      .map((s) => toChild(s.adSetId, s.name, s.status || ""))
      .sort((a, b) => b.spend - a.spend),
    ads: ads
      .map((a) => toChild(a.adId, a.name, a.status || ""))
      .sort((a, b) => b.spend - a.spend),
    daily: daily.map((d) => {
      const key = d.date.toISOString().slice(0, 10);
      return {
        date: key,
        spend: +d.spend.toFixed(2),
        clicks: d.clicks,
        leads: leadsByDay.get(key) ?? 0,
      };
    }),
  };
}

/** The delivery log on /admin/meta-capi: every lead's server-side send. */
export async function capiDeliveries(limit = 100): Promise<CapiDelivery[]> {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      metaCapiSentAt: true,
      metaCapiEventId: true,
      metaCapiError: true,
    },
  });
  return leads.map((l) => ({
    leadId: l.id,
    name: l.name,
    // Masked: this page is a delivery log, not the CRM. The full number is one
    // click away on /admin/leads for anyone who actually needs it.
    phone: l.phone ? `${l.phone.slice(0, 3)}•••••${l.phone.slice(-2)}` : "",
    createdAt: l.createdAt.toISOString(),
    sentAt: l.metaCapiSentAt?.toISOString() ?? null,
    eventId: l.metaCapiEventId,
    error: l.metaCapiError,
  }));
}
