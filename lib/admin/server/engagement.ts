import { prisma } from "@/lib/prisma";
import type {
  CtaStat,
  DeviceType,
  ErrorKind,
  ErrorRow,
  FormStat,
  FunnelStage,
  FunnelsData,
  VitalName,
  VitalStat,
} from "@/lib/admin/types";

/**
 * Queries behind /admin/funnels, /ctas, /forms, /performance and /errors.
 *
 * Kept out of queries.ts, which is already long and covers the original five
 * pages; these five all read the engagement events the collectors in
 * lib/track/collectors/ produce.
 */

export type EngagementRange = "7d" | "30d" | "90d" | "all";

export function since(range: EngagementRange): Date | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const rate = (n: number, d: number) => (d > 0 ? +((n / d) * 100).toFixed(1) : 0);

/* ── CTAs ─────────────────────────────────────────────────────────────────── */

export async function ctaStats(range: EngagementRange): Promise<CtaStat[]> {
  const createdAt = since(range);

  const rows = await prisma.event.findMany({
    where: {
      ctaId: { not: null },
      type: { in: ["CTA_VIEW", "CTA_HOVER", "CTA_CLICK"] },
      ...(createdAt ? { createdAt: { gte: createdAt } } : {}),
    },
    select: { ctaId: true, type: true, text: true, sessionId: true },
    take: 100_000,
  });

  interface Acc {
    label: string;
    views: number;
    hovers: number;
    clicks: number;
    clickedSessions: Set<string>;
  }
  const byCta = new Map<string, Acc>();
  for (const row of rows) {
    const id = row.ctaId as string;
    let acc = byCta.get(id);
    if (!acc) {
      acc = { label: "", views: 0, hovers: 0, clicks: 0, clickedSessions: new Set() };
      byCta.set(id, acc);
    }
    // The first non-empty label wins — the visible text is a nicer column than
    // the raw id, but the id is what is actually stable.
    if (!acc.label && row.text) acc.label = row.text;
    if (row.type === "CTA_VIEW") acc.views += 1;
    else if (row.type === "CTA_HOVER") acc.hovers += 1;
    else {
      acc.clicks += 1;
      acc.clickedSessions.add(row.sessionId);
    }
  }

  // Which of the clicking sessions went on to convert.
  const allClickers = [...byCta.values()].flatMap((a) => [...a.clickedSessions]);
  const convertedSet = new Set(
    allClickers.length
      ? (
          await prisma.session.findMany({
            where: { sessionId: { in: [...new Set(allClickers)] }, isConverted: true },
            select: { sessionId: true },
          })
        ).map((s) => s.sessionId)
      : []
  );

  return [...byCta.entries()]
    .map(([ctaId, acc]) => {
      const leads = [...acc.clickedSessions].filter((s) => convertedSet.has(s)).length;
      return {
        ctaId,
        label: acc.label || ctaId,
        views: acc.views,
        hovers: acc.hovers,
        clicks: acc.clicks,
        ctr: rate(acc.clicks, acc.views),
        leads,
        conversionRate: rate(leads, acc.clickedSessions.size),
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views);
}

/* ── Forms ────────────────────────────────────────────────────────────────── */

export async function formStats(range: EngagementRange): Promise<FormStat[]> {
  const createdAt = since(range);

  const rows = await prisma.event.findMany({
    where: {
      formId: { not: null },
      type: {
        in: [
          "FORM_OPEN",
          "FORM_START",
          "FORM_SUBMIT",
          "FORM_ABANDON",
          "VALIDATION_ERROR",
        ],
      },
      ...(createdAt ? { createdAt: { gte: createdAt } } : {}),
    },
    select: { formId: true, type: true, fieldName: true },
    take: 100_000,
  });

  interface Acc {
    views: number;
    starts: number;
    submits: number;
    abandons: number;
    validationErrors: number;
    fieldErrors: Map<string, number>;
  }
  const byForm = new Map<string, Acc>();
  for (const row of rows) {
    const id = row.formId as string;
    let acc = byForm.get(id);
    if (!acc) {
      acc = {
        views: 0,
        starts: 0,
        submits: 0,
        abandons: 0,
        validationErrors: 0,
        fieldErrors: new Map(),
      };
      byForm.set(id, acc);
    }
    if (row.type === "FORM_OPEN") acc.views += 1;
    else if (row.type === "FORM_START") acc.starts += 1;
    else if (row.type === "FORM_SUBMIT") acc.submits += 1;
    else if (row.type === "FORM_ABANDON") acc.abandons += 1;
    else {
      acc.validationErrors += 1;
      const f = row.fieldName || "unknown";
      acc.fieldErrors.set(f, (acc.fieldErrors.get(f) ?? 0) + 1);
    }
  }

  return [...byForm.entries()]
    .map(([formId, acc]) => {
      const worst = [...acc.fieldErrors.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        formId,
        views: acc.views,
        starts: acc.starts,
        submits: acc.submits,
        abandons: acc.abandons,
        validationErrors: acc.validationErrors,
        startRate: rate(acc.starts, acc.views),
        completionRate: rate(acc.submits, acc.starts),
        worstField: worst ? worst[0] : "",
      };
    })
    .sort((a, b) => b.starts - a.starts);
}

/* ── Core Web Vitals ──────────────────────────────────────────────────────── */

const VITAL_ORDER: VitalName[] = ["LCP", "INP", "CLS", "FCP", "TTFB"];

export async function vitalStats(range: EngagementRange): Promise<VitalStat[]> {
  const createdAt = since(range);
  const rows = await prisma.performanceMetric.findMany({
    where: createdAt ? { createdAt: { gte: createdAt } } : {},
    select: { name: true, value: true, rating: true },
    take: 100_000,
  });

  const byName = new Map<string, { values: number[]; good: number; ni: number; poor: number }>();
  for (const row of rows) {
    let acc = byName.get(row.name);
    if (!acc) {
      acc = { values: [], good: 0, ni: 0, poor: 0 };
      byName.set(row.name, acc);
    }
    acc.values.push(row.value);
    if (row.rating === "GOOD") acc.good += 1;
    else if (row.rating === "POOR") acc.poor += 1;
    else acc.ni += 1;
  }

  return VITAL_ORDER.map((name) => {
    const acc = byName.get(name);
    const values = (acc?.values ?? []).slice().sort((a, b) => a - b);
    // Google grades a site on the 75th percentile of real-user data, not the
    // mean — one slow outlier should not condemn an otherwise fast site, and a
    // fast median should not hide a slow quarter.
    const p75 = values.length
      ? values[Math.min(values.length - 1, Math.floor(values.length * 0.75))]
      : 0;
    return {
      name,
      good: acc?.good ?? 0,
      needsImprovement: acc?.ni ?? 0,
      poor: acc?.poor ?? 0,
      p75: name === "CLS" ? +p75.toFixed(3) : Math.round(p75),
      unit: name === "CLS" ? ("score" as const) : ("ms" as const),
      samples: values.length,
    };
  });
}

/* ── Errors ───────────────────────────────────────────────────────────────── */

export async function errorRows(range: EngagementRange): Promise<ErrorRow[]> {
  const createdAt = since(range);
  const rows = await prisma.errorEvent.findMany({
    where: createdAt ? { createdAt: { gte: createdAt } } : {},
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      id: true,
      kind: true,
      message: true,
      source: true,
      lineNo: true,
      path: true,
      createdAt: true,
      session: { select: { browser: true, os: true, device: true } },
    },
  });

  // Group identical errors: one broken image inside a carousel can produce a
  // hundred rows that all say the same thing.
  const grouped = new Map<string, ErrorRow>();
  for (const row of rows) {
    const key = `${row.kind}:${row.message}:${row.source ?? ""}:${row.lineNo ?? ""}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    grouped.set(key, {
      id: row.id,
      kind: row.kind as ErrorKind,
      message: row.message,
      source: row.source || "",
      lineNo: row.lineNo,
      path: row.path || "/",
      browser: row.session?.browser || "Unknown",
      os: row.session?.os || "Unknown",
      device: (row.session?.device || "UNKNOWN") as DeviceType | "UNKNOWN",
      count: 1,
      lastSeen: row.createdAt.toISOString(),
    });
  }

  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 100);
}

/* ── Funnels ──────────────────────────────────────────────────────────────── */

const FUNNEL_LABELS = [
  "Page View",
  "Scrolled 25%+",
  "CTA Click",
  "Form Start",
  "Lead Submit",
];

/**
 * All traffic vs Meta-ads-only, side by side. "Meta" means the session carries
 * an fbclid or a Meta campaign id — i.e. it arrived from a click on our own ad,
 * not merely from facebook.com.
 */
export async function funnelsData(range: EngagementRange): Promise<FunnelsData> {
  const startedAt = since(range);
  const base = startedAt ? { startedAt: { gte: startedAt } } : {};
  const metaOnly = {
    ...base,
    OR: [{ fbclid: { not: null } }, { metaCampaignId: { not: null } }],
  };

  const [all, meta] = await Promise.all([
    funnelFor(base),
    funnelFor(metaOnly),
  ]);
  return { all, meta };
}

async function funnelFor(
  where: Record<string, unknown>
): Promise<FunnelStage[]> {
  const sessions = await prisma.session.findMany({
    where,
    select: {
      sessionId: true,
      maxScrollPct: true,
      ctaClicked: true,
      formStarted: true,
      isConverted: true,
    },
    take: 50_000,
  });

  const counts = [
    sessions.length,
    sessions.filter((s) => s.maxScrollPct >= 25).length,
    sessions.filter((s) => s.ctaClicked).length,
    sessions.filter((s) => s.formStarted).length,
    sessions.filter((s) => s.isConverted).length,
  ];

  return FUNNEL_LABELS.map((label, i) => ({
    key: String(i),
    label,
    count: counts[i],
  }));
}

/* ── Empty fallbacks ──────────────────────────────────────────────────────── */

export const EMPTY_FUNNELS: FunnelsData = {
  all: FUNNEL_LABELS.map((label, i) => ({ key: String(i), label, count: 0 })),
  meta: FUNNEL_LABELS.map((label, i) => ({ key: String(i), label, count: 0 })),
};

export const EMPTY_VITALS: VitalStat[] = VITAL_ORDER.map((name) => ({
  name,
  good: 0,
  needsImprovement: 0,
  poor: 0,
  p75: 0,
  unit: name === "CLS" ? "score" : "ms",
  samples: 0,
}));
