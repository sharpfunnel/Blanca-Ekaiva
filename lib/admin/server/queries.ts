import { prisma } from "@/lib/prisma";
import type {
  DateRange,
  Distribution,
  HeatPoint,
  HoverElement,
  Lead,
  LeadStats,
  OverviewData,
  ScrollBucket,
  SessionRow,
  SessionStats,
  TechStackData,
  TimePoint,
  Trend,
} from "@/lib/admin/types";
import type { HeatmapData } from "@/lib/admin/api";

/* ── Date windows ─────────────────────────────────────────────────────────── */
function windowFor(range: DateRange) {
  const end = new Date();
  const start = new Date(end);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
  } else start.setDate(start.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90));
  const span = end.getTime() - start.getTime();
  return { start, end, prevStart: new Date(start.getTime() - span) };
}

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);
function delta(cur: number, prev: number): { delta: number; trend: Trend } {
  if (prev === 0) return { delta: cur > 0 ? 100 : 0, trend: cur > 0 ? "up" : "flat" };
  const d = ((cur - prev) / prev) * 100;
  return { delta: Math.abs(d), trend: d > 0.5 ? "up" : d < -0.5 ? "down" : "flat" };
}
const distFrom = (rows: { key: string | null }[]): Distribution[] => {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r.key || "Unknown";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const SESSION_SELECT = {
  visitorId: true, startedAt: true, durationMs: true, isBounce: true,
  isConverted: true, ctaClicked: true, formStarted: true, formSubmitted: true,
  maxScrollPct: true, visitorType: true, device: true, browser: true, os: true,
  country: true, countryCode: true, trafficSource: true, trafficMedium: true, campaign: true,
} as const;

/* ── Overview ─────────────────────────────────────────────────────────────── */
export async function overviewData(range: DateRange): Promise<OverviewData> {
  const { start, end, prevStart } = windowFor(range);
  const inRange = { gte: start, lte: end };

  const [sessions, prevSessions, leads, prevLeadCount, ctaCount, pageGroups] =
    await Promise.all([
      prisma.session.findMany({ where: { startedAt: inRange }, select: SESSION_SELECT }),
      prisma.session.findMany({ where: { startedAt: { gte: prevStart, lt: start } }, select: { visitorId: true } }),
      prisma.lead.findMany({ where: { createdAt: inRange }, select: { createdAt: true } }),
      prisma.lead.count({ where: { createdAt: { gte: prevStart, lt: start } } }),
      prisma.event.count({ where: { type: "CTA_CLICK", createdAt: inRange } }),
      prisma.event.groupBy({ by: ["path"], where: { type: "PAGEVIEW", createdAt: inRange }, _count: { _all: true } }),
    ]);

  const visitors = new Set(sessions.map((s) => s.visitorId)).size;
  const prevVisitors = new Set(prevSessions.map((s) => s.visitorId)).size;
  const nSessions = sessions.length;
  const nLeads = leads.length;
  const returning = new Set(sessions.filter((s) => s.visitorType === "RETURNING").map((s) => s.visitorId)).size;
  const scroll50 = sessions.filter((s) => s.maxScrollPct >= 50).length;
  const bounced = sessions.filter((s) => s.isBounce).length;
  const avgDur = nSessions ? sessions.reduce((a, s) => a + s.durationMs, 0) / nSessions : 0;

  const dV = delta(visitors, prevVisitors);
  const dS = delta(nSessions, prevSessions.length);
  const dL = delta(nLeads, prevLeadCount);

  const metrics = [
    { key: "visitors", label: "Total Visitors", value: visitors, format: "number" as const, ...dV },
    { key: "sessions", label: "Total Sessions", value: nSessions, format: "number" as const, ...dS },
    { key: "leads", label: "Total Leads", value: nLeads, format: "number" as const, ...dL },
    { key: "cvr", label: "Conversion Rate", value: pct(nLeads, nSessions), format: "percent" as const, delta: 0, trend: "flat" as Trend },
    { key: "scroll", label: "Scroll Depth (50%)", value: pct(scroll50, nSessions), format: "percent" as const, delta: 0, trend: "flat" as Trend },
    { key: "cta", label: "CTA Clicks", value: ctaCount, format: "number" as const, delta: 0, trend: "flat" as Trend },
    { key: "avgdur", label: "Avg Session Duration", value: avgDur, format: "duration" as const, delta: 0, trend: "flat" as Trend },
    { key: "bounce", label: "Bounce Rate", value: pct(bounced, nSessions), format: "percent" as const, delta: 0, trend: "flat" as Trend },
    { key: "returning", label: "Returning Visitors", value: returning, format: "number" as const, delta: 0, trend: "flat" as Trend },
    { key: "new", label: "New Visitors", value: Math.max(0, visitors - returning), format: "number" as const, delta: 0, trend: "flat" as Trend },
  ];

  const s = (f: (x: (typeof sessions)[number]) => boolean) => sessions.filter(f).length;
  const funnel = [
    { key: "visitors", label: "Visitors", count: nSessions },
    { key: "s25", label: "Scrolled 25%", count: s((x) => x.maxScrollPct >= 25) },
    { key: "s50", label: "Scrolled 50%", count: s((x) => x.maxScrollPct >= 50) },
    { key: "s75", label: "Scrolled 75%", count: s((x) => x.maxScrollPct >= 75) },
    { key: "cta", label: "Clicked CTA", count: s((x) => x.ctaClicked) },
    { key: "open", label: "Opened Form", count: s((x) => x.formStarted) },
    { key: "start", label: "Started Form", count: s((x) => x.formStarted) },
    { key: "submit", label: "Submitted Form", count: s((x) => x.formSubmitted) },
    { key: "lead", label: "Lead Generated", count: nLeads },
  ];

  // Traffic sources
  const srcMap = new Map<string, { source: string; medium: string; campaign: string; sessions: number; leads: number }>();
  for (const x of sessions) {
    const key = `${x.trafficSource}|${x.trafficMedium}|${x.campaign}`;
    const row = srcMap.get(key) ?? {
      source: x.trafficSource || "Direct", medium: x.trafficMedium || "none",
      campaign: x.campaign || "(direct)", sessions: 0, leads: 0,
    };
    row.sessions++;
    if (x.isConverted) row.leads++;
    srcMap.set(key, row);
  }
  const sources = [...srcMap.values()].sort((a, b) => b.sessions - a.sessions);

  const devices = distFrom(sessions.map((x) => ({ key: labelDevice(x.device) })));
  const browsers = distFrom(sessions.map((x) => ({ key: x.browser })));
  const countryMap = new Map<string, { code: string; value: number }>();
  for (const x of sessions) {
    const label = x.country || "Unknown";
    const e = countryMap.get(label) ?? { code: x.countryCode || "", value: 0 };
    e.value++;
    countryMap.set(label, e);
  }
  const countries = [...countryMap.entries()]
    .map(([label, v]) => ({ label, code: v.code, value: v.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const topPages = pageGroups
    .map((g) => ({ path: g.path || "/", title: pageTitle(g.path || "/"), views: g._count._all, avgTimeMs: 0, bounceRate: 0, conversions: 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  return {
    metrics, funnel, sources,
    timeseries: buildTimeseries(range, sessions.map((x) => x.startedAt), leads.map((l) => l.createdAt)),
    devices, browsers, countries, topPages,
    recentLeads: await fetchLeads(10),
  };
}

function buildTimeseries(range: DateRange, sessionDates: Date[], leadDates: Date[]): TimePoint[] {
  const hourly = range === "today" || range === "yesterday";
  const buckets: TimePoint[] = [];
  const now = new Date();
  if (hourly) {
    for (let h = 0; h < 24; h++) buckets.push({ label: `${String(h).padStart(2, "0")}:00`, visitors: 0, sessions: 0, leads: 0 });
    const key = (d: Date) => d.getHours();
    for (const d of sessionDates) { const b = buckets[key(d)]; if (b) { b.sessions++; b.visitors++; } }
    for (const d of leadDates) { const b = buckets[key(d)]; if (b) b.leads++; }
  } else {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const idx = new Map<string, TimePoint>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const k = d.toDateString();
      const p: TimePoint = { label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), visitors: 0, sessions: 0, leads: 0 };
      idx.set(k, p); buckets.push(p);
    }
    for (const d of sessionDates) { const p = idx.get(new Date(d).toDateString()); if (p) { p.sessions++; p.visitors++; } }
    for (const d of leadDates) { const p = idx.get(new Date(d).toDateString()); if (p) p.leads++; }
  }
  return buckets;
}

/* ── Leads ────────────────────────────────────────────────────────────────── */
export async function fetchLeads(limit = 300): Promise<Lead[]> {
  const rows = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      session: { include: { events: { orderBy: { createdAt: "asc" }, take: 40 } } },
    },
  });
  return rows.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email || "",
    interest: l.interest || "—",
    budget: l.budget || "—",
    city: l.city || "—",
    country: l.country || "—",
    countryCode: l.session?.countryCode || "",
    source: l.source || "Direct",
    campaign: l.campaign || "(direct)",
    // Source/medium/campaign are copied onto the lead at creation; content,
    // term, placement and the raw params come from the originating session.
    utmSource: l.utmSource || l.session?.utmSource || "",
    utmMedium: l.utmMedium || l.session?.utmMedium || "",
    utmCampaign: l.utmCampaign || l.session?.utmCampaign || "",
    utmContent: l.session?.utmContent || "",
    utmTerm: l.session?.utmTerm || "",
    placement: l.session?.placement || "",
    metaAdId: l.session?.metaAdId || "",
    rawParams: (l.session?.rawParams as Record<string, string> | null) ?? null,
    device: (l.device as Lead["device"]) || "DESKTOP",
    browser: l.browser || "—",
    os: l.os || "—",
    ip: l.ip || "—",
    status: l.status,
    assignedTo: l.assignedTo || "Unassigned",
    metaCapiSentAt: l.metaCapiSentAt ? l.metaCapiSentAt.toISOString() : null,
    metaCapiError: l.metaCapiError ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    journey: (l.session?.events ?? []).map((e) => ({
      at: e.createdAt.toISOString(),
      label: journeyLabel(e.type),
      detail: e.text || (e.meta as { id?: string } | null)?.id || undefined,
    })),
    notes: l.notes.map((n) => ({ at: n.createdAt.toISOString(), author: n.author || "Team", body: n.body })),
  }));
}

export async function leadStats(): Promise<LeadStats> {
  const [total, today, qualified, won, lost] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.lead.count({ where: { status: { in: ["QUALIFIED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"] } } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { status: "LOST" } }),
  ]);
  const sessions = await prisma.session.count();
  return { total, today, qualified, won, lost, conversionRate: pct(total, sessions) };
}

/* ── Sessions ─────────────────────────────────────────────────────────────── */
export async function fetchSessions(limit = 200): Promise<SessionRow[]> {
  const rows = await prisma.session.findMany({ orderBy: { startedAt: "desc" }, take: limit });
  return rows.map((s) => ({
    id: s.sessionId,
    visitorId: s.visitorId,
    visitorType: s.visitorType,
    visitTime: s.startedAt.toISOString(),
    ip: s.ip || "—",
    country: s.country || "—",
    countryCode: s.countryCode || "",
    city: s.city || "—",
    region: s.region || "—",
    timezone: s.timezone || "—",
    device:
      s.device === "BOT" || s.device === "UNKNOWN"
        ? "DESKTOP"
        : (s.device as SessionRow["device"]),
    os: s.os || "—",
    browser: s.browser || "—",
    screen: s.screenW && s.screenH ? `${s.screenW}×${s.screenH}` : "—",
    language: s.language || "—",
    network: s.network || "—",
    referrer: s.referrer || "(direct)",
    source: s.trafficSource || "Direct",
    campaign: s.campaign || "(direct)",
    utmSource: s.utmSource || "",
    utmMedium: s.utmMedium || "",
    utmCampaign: s.utmCampaign || "",
    utmContent: s.utmContent || "",
    utmTerm: s.utmTerm || "",
    placement: s.placement || "",
    gclid: s.gclid || "",
    fbclid: s.fbclid || "",
    msclkid: s.msclkid || "",
    metaCampaignId: s.metaCampaignId || "",
    rawParams: (s.rawParams as Record<string, string> | null) ?? null,
    landingPage: s.landingPage || "/",
    currentPage: s.currentPage || "/",
    pageViews: s.pageViews,
    durationMs: s.durationMs,
    avgScroll: s.avgScrollPct,
    maxScroll: s.maxScrollPct,
    clicks: s.clicks,
    mouseMoves: s.mouseMoves,
    formStarted: s.formStarted,
    formSubmitted: s.formSubmitted,
    ctaClicked: s.ctaClicked,
    bounce: s.isBounce,
    status: s.status,
  }));
}

export async function sessionStats(): Promise<SessionStats> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [total, live, returning, agg, bounced] = await Promise.all([
    prisma.session.count(),
    prisma.session.count({ where: { lastActiveAt: { gte: fiveMinAgo } } }),
    prisma.session.count({ where: { visitorType: "RETURNING" } }),
    prisma.session.aggregate({ _avg: { durationMs: true } }),
    prisma.session.count({ where: { isBounce: true } }),
  ]);
  return {
    total, live, returning,
    avgDurationMs: Math.round(agg._avg.durationMs ?? 0),
    bounceRate: pct(bounced, total),
  };
}

/* ── Heatmap ──────────────────────────────────────────────────────────────── */
export async function heatmapData(): Promise<HeatmapData> {
  const clickTypes = ["CLICK", "CTA_CLICK", "ANCHOR_CLICK", "PHONE_CLICK", "WHATSAPP_CLICK", "EMAIL_CLICK", "IMAGE_CLICK", "OUTBOUND_LINK", "BOOK_SITE_VISIT", "DOWNLOAD_BROCHURE"];
  const [clicks, totalSessions, scrollEvents] = await Promise.all([
    prisma.event.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { type: { in: clickTypes as any }, relX: { not: null }, relY: { not: null } },
      select: { relX: true, relY: true, text: true, selector: true, sessionId: true },
      take: 5000,
    }),
    prisma.session.count(),
    prisma.event.findMany({ where: { type: "SCROLL" }, select: { sessionId: true, scrollPct: true } }),
  ]);

  // Grid-bucket clicks into heat points
  const GX = 32, GY = 60;
  const cells = new Map<string, { x: number; y: number; n: number; label: string }>();
  for (const c of clicks) {
    const gx = Math.min(GX - 1, Math.floor((c.relX as number) * GX));
    const gy = Math.min(GY - 1, Math.floor((c.relY as number) * GY));
    const key = `${gx}:${gy}`;
    const e = cells.get(key) ?? { x: (gx + 0.5) / GX, y: (gy + 0.5) / GY, n: 0, label: c.text || c.selector || "Element" };
    e.n++;
    if (c.text && !e.label) e.label = c.text;
    cells.set(key, e);
  }
  const maxN = Math.max(1, ...[...cells.values()].map((c) => c.n));
  const points: HeatPoint[] = [...cells.values()].map((c) => ({
    relX: c.x, relY: c.y, intensity: c.n / maxN, clicks: c.n,
    visitors: c.n, conversion: 0, avgTimeMs: 0, label: c.label.slice(0, 60) || "Element",
  }));

  // Scroll reach
  const reachAt = (m: number) => new Set(scrollEvents.filter((e) => (e.scrollPct ?? 0) >= m).map((e) => e.sessionId)).size;
  const scroll: ScrollBucket[] = [0, 25, 50, 75, 100].map((p) => ({
    pct: p, reached: p === 0 ? 100 : Math.round(pct(reachAt(p), totalSessions)),
  }));

  // "Hover"/engagement proxy: most-interacted elements by click count
  const byLabel = new Map<string, number>();
  for (const c of clicks) {
    const l = (c.text || c.selector || "Element").slice(0, 60);
    byLabel.set(l, (byLabel.get(l) ?? 0) + 1);
  }
  const hover: HoverElement[] = [...byLabel.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([label, hovers]) => ({ label, hovers, kind: guessKind(label) }));

  return { points, scroll, hover };
}

/* ── Tech stack ───────────────────────────────────────────────────────────── */
export async function techStackData(): Promise<TechStackData> {
  const rows = await prisma.session.findMany({
    select: { device: true, browser: true, os: true, screenW: true, screenH: true, network: true, language: true },
    take: 20000,
  });
  const dist = (vals: (string | null)[]): Distribution[] => distFrom(vals.map((v) => ({ key: v })));
  return {
    devices: dist(rows.map((r) => labelDevice(r.device))),
    browsers: dist(rows.map((r) => r.browser)),
    os: dist(rows.map((r) => r.os)),
    resolutions: dist(rows.map((r) => (r.screenW && r.screenH ? `${r.screenW}×${r.screenH}` : null))),
    networks: dist(rows.map((r) => r.network)),
    languages: dist(rows.map((r) => r.language)),
  };
}

/* ── Empty fallbacks (no DB / error) ──────────────────────────────────────── */
export const EMPTY_OVERVIEW = (): OverviewData => ({
  metrics: [
    ["visitors", "Total Visitors", "number"], ["sessions", "Total Sessions", "number"],
    ["leads", "Total Leads", "number"], ["cvr", "Conversion Rate", "percent"],
    ["scroll", "Scroll Depth (50%)", "percent"], ["cta", "CTA Clicks", "number"],
    ["avgdur", "Avg Session Duration", "duration"], ["bounce", "Bounce Rate", "percent"],
    ["returning", "Returning Visitors", "number"], ["new", "New Visitors", "number"],
  ].map(([key, label, format]) => ({ key, label, value: 0, format: format as "number", delta: 0, trend: "flat" as Trend })),
  funnel: ["Visitors", "Scrolled 25%", "Scrolled 50%", "Scrolled 75%", "Clicked CTA", "Opened Form", "Started Form", "Submitted Form", "Lead Generated"].map((label, i) => ({ key: String(i), label, count: 0 })),
  sources: [], timeseries: [], devices: [], browsers: [], countries: [], topPages: [], recentLeads: [],
});
export const EMPTY_LEAD_STATS: LeadStats = { total: 0, today: 0, qualified: 0, won: 0, lost: 0, conversionRate: 0 };
export const EMPTY_SESSION_STATS: SessionStats = { total: 0, live: 0, returning: 0, avgDurationMs: 0, bounceRate: 0 };
export const EMPTY_HEATMAP: HeatmapData = { points: [], scroll: [0, 25, 50, 75, 100].map((p) => ({ pct: p, reached: p === 0 ? 100 : 0 })), hover: [] };
export const EMPTY_TECH: TechStackData = { devices: [], browsers: [], os: [], resolutions: [], networks: [], languages: [] };

/* ── helpers ──────────────────────────────────────────────────────────────── */
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function labelDevice(d: string): string {
  return { DESKTOP: "Desktop", MOBILE: "Mobile", TABLET: "Tablet", SMART_TV: "Smart TV" }[d] || "Other";
}
function pageTitle(path: string): string {
  const map: Record<string, string> = { "/": "Landing Page", "/#spaces": "Office & Retail", "/#amenities": "Amenities", "/#location": "Location", "/#enquire": "Lead Form", "/#faq": "FAQ" };
  return map[path] || path;
}
function journeyLabel(type: string): string {
  const map: Record<string, string> = {
    PAGEVIEW: "Landed on page", CTA_CLICK: "Clicked CTA", FORM_OPEN: "Opened form",
    FORM_START: "Started form", FORM_SUBMIT: "Submitted form", SCROLL: "Scrolled",
    SECTION_VIEW: "Viewed section", PHONE_CLICK: "Clicked call", WHATSAPP_CLICK: "Clicked WhatsApp",
  };
  return map[type] || type;
}
function guessKind(label: string): HoverElement["kind"] {
  if (/submit|get |call|whatsapp|enquire|button/i.test(label)) return "Button";
  if (/form|field|name|phone|email/i.test(label)) return "Form";
  if (/img|image|photo|gallery/i.test(label)) return "Image";
  if (/card|space|amenit/i.test(label)) return "Card";
  return "Heading";
}
