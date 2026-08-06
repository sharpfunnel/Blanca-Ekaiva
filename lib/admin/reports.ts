import "server-only";

import { prisma } from "@/lib/prisma";
import { campaignRows } from "@/lib/meta/queries";
import type { EngagementRange } from "@/lib/admin/server/engagement";
import { since } from "@/lib/admin/server/engagement";

/**
 * Date-ranged rollups for the export routes.
 *
 * Pure read-and-format on data that already exists — no new model, no new
 * capture. Every report is a flat array of flat rows, because that is the
 * common denominator CSV, XLSX and PDF can all render without special-casing.
 */

export type ReportKind = "overview" | "leads" | "campaigns";
export type ReportFormat = "csv" | "xlsx" | "pdf";

export interface Report {
  title: string;
  /** Column order is taken from the first row's keys. */
  rows: Record<string, string | number>[];
}

export const REPORT_KINDS: { value: ReportKind; label: string; description: string }[] =
  [
    {
      value: "overview",
      label: "Overview",
      description: "Daily visitors, sessions, leads and conversion rate.",
    },
    {
      value: "leads",
      label: "Leads",
      description: "Every enquiry with its source, campaign and status.",
    },
    {
      value: "campaigns",
      label: "Campaigns",
      description: "Meta Ads spend beside the sessions and leads it produced.",
    },
  ];

export async function buildReport(
  kind: ReportKind,
  range: EngagementRange
): Promise<Report> {
  if (kind === "leads") return leadsReport(range);
  if (kind === "campaigns") return campaignsReport(range);
  return overviewReport(range);
}

async function overviewReport(range: EngagementRange): Promise<Report> {
  const from = since(range);
  const [sessions, leads] = await Promise.all([
    prisma.session.findMany({
      where: from ? { startedAt: { gte: from } } : {},
      select: { startedAt: true, visitorId: true, isBounce: true },
      take: 100_000,
    }),
    prisma.lead.findMany({
      where: from ? { createdAt: { gte: from } } : {},
      select: { createdAt: true },
      take: 100_000,
    }),
  ]);

  interface Day {
    sessions: number;
    visitors: Set<string>;
    bounces: number;
    leads: number;
  }
  const byDay = new Map<string, Day>();
  const dayOf = (d: Date) => d.toISOString().slice(0, 10);
  const ensure = (key: string) => {
    let day = byDay.get(key);
    if (!day) {
      day = { sessions: 0, visitors: new Set(), bounces: 0, leads: 0 };
      byDay.set(key, day);
    }
    return day;
  };

  for (const s of sessions) {
    const day = ensure(dayOf(s.startedAt));
    day.sessions += 1;
    day.visitors.add(s.visitorId);
    if (s.isBounce) day.bounces += 1;
  }
  for (const l of leads) ensure(dayOf(l.createdAt)).leads += 1;

  const rows = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, day]) => ({
      Date: date,
      Visitors: day.visitors.size,
      Sessions: day.sessions,
      Leads: day.leads,
      "Conversion %": day.sessions
        ? +((day.leads / day.sessions) * 100).toFixed(2)
        : 0,
      "Bounce %": day.sessions
        ? +((day.bounces / day.sessions) * 100).toFixed(2)
        : 0,
    }));

  return { title: `Overview — ${rangeLabel(range)}`, rows };
}

async function leadsReport(range: EngagementRange): Promise<Report> {
  const from = since(range);
  const leads = await prisma.lead.findMany({
    where: from ? { createdAt: { gte: from } } : {},
    orderBy: { createdAt: "desc" },
    take: 10_000,
    select: {
      createdAt: true,
      name: true,
      phone: true,
      email: true,
      interest: true,
      budget: true,
      city: true,
      country: true,
      source: true,
      utmSource: true,
      utmCampaign: true,
      status: true,
      metaCapiSentAt: true,
    },
  });

  const rows = leads.map((l) => ({
    Date: l.createdAt.toISOString().slice(0, 16).replace("T", " "),
    Name: l.name,
    Phone: l.phone,
    Email: l.email || "",
    Interest: l.interest || "",
    Budget: l.budget || "",
    City: l.city || "",
    Country: l.country || "",
    Source: l.source || "",
    "UTM Source": l.utmSource || "",
    "UTM Campaign": l.utmCampaign || "",
    Status: l.status,
    "CAPI Sent": l.metaCapiSentAt ? "yes" : "no",
  }));

  return { title: `Leads — ${rangeLabel(range)}`, rows };
}

async function campaignsReport(range: EngagementRange): Promise<Report> {
  const campaigns = await campaignRows(range);
  const rows = campaigns.map((c) => ({
    Campaign: c.name,
    Status: c.status,
    Objective: c.objective,
    Spend: c.spend,
    Impressions: c.impressions,
    Clicks: c.clicks,
    "CTR %": c.ctr,
    CPC: c.cpc,
    "Meta Results": c.results,
    Sessions: c.sessions,
    Leads: c.leads,
    "Cost / Lead": c.costPerLead,
    Currency: c.currency,
  }));
  return { title: `Campaigns — ${rangeLabel(range)}`, rows };
}

function rangeLabel(range: EngagementRange) {
  return range === "all" ? "all time" : `last ${range.replace("d", " days")}`;
}
