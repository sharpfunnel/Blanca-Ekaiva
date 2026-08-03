import type {
  DateRange,
  Distribution,
  FunnelStage,
  HeatPoint,
  HoverElement,
  Lead,
  LeadStats,
  LeadStatus,
  Metric,
  OverviewData,
  ScrollBucket,
  SessionRow,
  SessionStats,
  TechStackData,
  TimePoint,
  TopPage,
  TrafficSource,
} from "./types";

/* ── Seeded RNG so the dummy dataset is stable across reloads ─────────────── */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260731);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;
const chance = (p: number) => rng() < p;

/* ── Sample pools ─────────────────────────────────────────────────────────── */
const FIRST = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Neha",
  "Arjun", "Kavya", "Sanjay", "Pooja", "Karan", "Divya", "Manish", "Ritu",
  "Aditya", "Meera", "Suresh", "Nisha", "Rajesh", "Isha", "Varun", "Tanvi",
];
const LAST = [
  "Sharma", "Patel", "Mehta", "Shah", "Verma", "Gupta", "Nair", "Reddy",
  "Iyer", "Joshi", "Kulkarni", "Desai", "Rao", "Singh", "Kapoor", "Malhotra",
];
const CITIES: { city: string; region: string; country: string; code: string; tz: string }[] = [
  { city: "Mumbai", region: "Maharashtra", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Navi Mumbai", region: "Maharashtra", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Thane", region: "Maharashtra", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Pune", region: "Maharashtra", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Delhi", region: "Delhi", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Bengaluru", region: "Karnataka", country: "India", code: "IN", tz: "Asia/Kolkata" },
  { city: "Dubai", region: "Dubai", country: "UAE", code: "AE", tz: "Asia/Dubai" },
  { city: "Singapore", region: "Central", country: "Singapore", code: "SG", tz: "Asia/Singapore" },
  { city: "London", region: "England", country: "UK", code: "GB", tz: "Europe/London" },
  { city: "Toronto", region: "Ontario", country: "Canada", code: "CA", tz: "America/Toronto" },
];
const SOURCES = [
  { source: "Google", medium: "cpc", campaign: "Search-Commercial" },
  { source: "Facebook", medium: "paid_social", campaign: "Blanca-Leadgen" },
  { source: "Instagram", medium: "paid_social", campaign: "Blanca-Reels" },
  { source: "Direct", medium: "none", campaign: "(direct)" },
  { source: "Google", medium: "organic", campaign: "(organic)" },
  { source: "Referral", medium: "referral", campaign: "99acres" },
  { source: "WhatsApp", medium: "social", campaign: "Broadcast" },
  { source: "Email", medium: "email", campaign: "Newsletter-Jul" },
];
const DEVICES = ["DESKTOP", "MOBILE", "TABLET", "SMART_TV"] as const;
const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox", "Opera", "Samsung Internet"];
const OSES = ["Windows", "macOS", "Android", "iOS", "Linux"];
const RESOLUTIONS = ["1920×1080", "1440×900", "1366×768", "390×844", "412×915", "768×1024", "2560×1440"];
const NETWORKS = ["4G", "5G", "WiFi", "Broadband", "3G"];
const LANGUAGES = ["en-IN", "en-US", "hi-IN", "mr-IN", "en-GB"];
const INTERESTS = ["Office", "Retail", "Both"];
const BUDGETS = ["Under ₹1 Cr", "₹1 Cr – ₹2 Cr", "₹2 Cr – ₹5 Cr", "₹5 Cr+", "Not sure yet"];
const STATUSES: LeadStatus[] = [
  "NEW", "CONTACTED", "QUALIFIED", "INTERESTED",
  "SITE_VISIT_SCHEDULED", "NEGOTIATION", "WON", "LOST", "SPAM",
];
const AGENTS = ["Rahul Thakur", "Unassigned", "Priya Desk", "Sales Team"];
const PAGES = ["/", "/#spaces", "/#amenities", "/#location", "/#enquire", "/#faq"];

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/* ── Leads (stable set) ───────────────────────────────────────────────────── */
function makeLead(i: number): Lead {
  const loc = pick(CITIES);
  const src = pick(SOURCES);
  const device = pick(DEVICES);
  const createdMin = int(2, 60 * 24 * 20);
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const status = pick(STATUSES);
  return {
    id: `LD-${String(1000 + i)}`,
    name,
    phone: `+91 9${int(600000000, 999999999)}`,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
    interest: pick(INTERESTS),
    budget: pick(BUDGETS),
    city: loc.city,
    country: loc.country,
    countryCode: loc.code,
    source: src.source,
    campaign: src.campaign,
    utmSource: src.source.toLowerCase(),
    utmMedium: src.medium,
    utmCampaign: src.campaign,
    utmContent: chance(0.4) ? "video_ad_1" : "",
    utmTerm: chance(0.4) ? "adset_broad" : "",
    placement: chance(0.4) ? pick(["instagram_reels", "facebook_feed", "search_top"]) : "",
    rawParams: null,
    device,
    browser: pick(BROWSERS),
    os: pick(OSES),
    ip: `${int(14, 223)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
    status,
    assignedTo: pick(AGENTS),
    createdAt: minutesAgo(createdMin),
    updatedAt: minutesAgo(Math.max(1, createdMin - int(1, 200))),
    journey: [
      { at: minutesAgo(createdMin + 6), label: "Landed on page", detail: `${src.source} · ${src.campaign}` },
      { at: minutesAgo(createdMin + 5), label: "Scrolled to Amenities", detail: "62% depth" },
      { at: minutesAgo(createdMin + 4), label: "Clicked CTA", detail: "Get Price & Floor Plan" },
      { at: minutesAgo(createdMin + 3), label: "Opened lead form" },
      { at: minutesAgo(createdMin + 2), label: "Started filling form" },
      { at: minutesAgo(createdMin), label: "Submitted form", detail: "Lead generated" },
    ],
    notes:
      chance(0.4)
        ? [{ at: minutesAgo(createdMin - 30), author: "Rahul Thakur", body: "Called, asked for floor plans. Following up tomorrow." }]
        : [],
  };
}
let _leads: Lead[] | null = null;
export function mockLeads(): Lead[] {
  if (!_leads) _leads = Array.from({ length: 48 }, (_, i) => makeLead(i)).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  return _leads;
}

/* ── Sessions (stable set) ────────────────────────────────────────────────── */
function makeSession(i: number): SessionRow {
  const loc = pick(CITIES);
  const src = pick(SOURCES);
  const device = pick(DEVICES);
  const live = i < 3;
  const minAgo = live ? 0 : int(1, 60 * 24 * 7);
  const pageViews = int(1, 9);
  const bounce = pageViews === 1 && chance(0.5);
  const formStarted = chance(0.28);
  const formSubmitted = formStarted && chance(0.5);
  return {
    id: `SS-${String(50000 + i)}`,
    visitorId: `VS-${String(9000 + int(0, 400))}`,
    visitorType: chance(0.32) ? "RETURNING" : "NEW",
    visitTime: minutesAgo(minAgo),
    ip: `${int(14, 223)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
    country: loc.country,
    countryCode: loc.code,
    city: loc.city,
    region: loc.region,
    timezone: loc.tz,
    device,
    os: pick(OSES),
    browser: pick(BROWSERS),
    screen: pick(RESOLUTIONS),
    language: pick(LANGUAGES),
    network: pick(NETWORKS),
    referrer: src.source === "Direct" ? "(direct)" : `${src.source.toLowerCase()}.com`,
    source: src.source,
    campaign: src.campaign,
    utmSource: src.medium === "none" ? "" : src.source.toLowerCase(),
    utmMedium: src.medium === "none" ? "" : src.medium,
    utmCampaign: src.medium === "none" ? "" : src.campaign,
    utmContent: chance(0.3) ? "video_ad_1" : "",
    utmTerm: chance(0.3) ? "adset_broad" : "",
    placement: chance(0.3) ? pick(["instagram_reels", "facebook_feed"]) : "",
    gclid: src.source === "Google" && src.medium === "cpc" ? "abc123" : "",
    fbclid: src.source === "Facebook" ? "fb_abc" : "",
    msclkid: "",
    metaCampaignId: src.source === "Facebook" ? String(int(100000, 999999)) : "",
    rawParams: null,
    landingPage: "/",
    currentPage: live ? pick(PAGES) : pick(PAGES),
    pageViews,
    durationMs: bounce ? int(2000, 12000) : int(20000, 640000),
    avgScroll: int(15, 78),
    maxScroll: int(35, 100),
    clicks: int(0, 40),
    mouseMoves: int(30, 1800),
    formStarted,
    formSubmitted,
    ctaClicked: chance(0.44),
    bounce,
    status: live ? "ACTIVE" : bounce ? "BOUNCED" : "ENDED",
  };
}
let _sessions: SessionRow[] | null = null;
export function mockSessions(): SessionRow[] {
  if (!_sessions)
    _sessions = Array.from({ length: 40 }, (_, i) => makeSession(i)).sort(
      (a, b) => +new Date(b.visitTime) - +new Date(a.visitTime)
    );
  return _sessions;
}

/* ── Aggregates ───────────────────────────────────────────────────────────── */
const RANGE_SCALE: Record<DateRange, number> = {
  today: 1, yesterday: 1.1, "7d": 6.4, "30d": 26, "90d": 72,
};

export function mockOverview(range: DateRange): OverviewData {
  const s = RANGE_SCALE[range];
  const visitors = Math.round(1280 * s);
  const sessions = Math.round(1610 * s);
  const leads = Math.round(96 * s);

  const metrics: Metric[] = [
    { key: "visitors", label: "Total Visitors", value: visitors, format: "number", delta: 12.4, trend: "up" },
    { key: "sessions", label: "Total Sessions", value: sessions, format: "number", delta: 8.1, trend: "up" },
    { key: "leads", label: "Total Leads", value: leads, format: "number", delta: 15.7, trend: "up" },
    { key: "cvr", label: "Conversion Rate", value: (leads / sessions) * 100, format: "percent", delta: 3.2, trend: "up" },
    { key: "scroll", label: "Scroll Depth (50%)", value: 68.3, format: "percent", delta: 1.4, trend: "up" },
    { key: "cta", label: "CTA Clicks", value: Math.round(430 * s), format: "number", delta: 9.6, trend: "up" },
    { key: "avgdur", label: "Avg Session Duration", value: 138000, format: "duration", delta: -2.1, trend: "down" },
    { key: "bounce", label: "Bounce Rate", value: 38.9, format: "percent", delta: -4.3, trend: "down" },
    { key: "returning", label: "Returning Visitors", value: Math.round(visitors * 0.31), format: "number", delta: 6.8, trend: "up" },
    { key: "new", label: "New Visitors", value: Math.round(visitors * 0.69), format: "number", delta: 5.2, trend: "up" },
  ];

  const funnel: FunnelStage[] = [
    { key: "visitors", label: "Visitors", count: visitors },
    { key: "s25", label: "Scrolled 25%", count: Math.round(visitors * 0.82) },
    { key: "s50", label: "Scrolled 50%", count: Math.round(visitors * 0.63) },
    { key: "s75", label: "Scrolled 75%", count: Math.round(visitors * 0.41) },
    { key: "cta", label: "Clicked CTA", count: Math.round(visitors * 0.27) },
    { key: "open", label: "Opened Form", count: Math.round(visitors * 0.19) },
    { key: "start", label: "Started Form", count: Math.round(visitors * 0.13) },
    { key: "submit", label: "Submitted Form", count: Math.round(visitors * 0.081) },
    { key: "lead", label: "Lead Generated", count: leads },
  ];

  const sources: TrafficSource[] = SOURCES.map((src, i) => {
    const ses = Math.round((sessions * (0.26 - i * 0.025)) * (0.7 + rng() * 0.6));
    return {
      source: src.source, medium: src.medium, campaign: src.campaign,
      sessions: Math.max(24, ses),
      leads: Math.max(1, Math.round(ses * (0.03 + rng() * 0.06))),
    };
  }).sort((a, b) => b.sessions - a.sessions);

  const devices: Distribution[] = [
    { label: "Mobile", value: Math.round(visitors * 0.58) },
    { label: "Desktop", value: Math.round(visitors * 0.33) },
    { label: "Tablet", value: Math.round(visitors * 0.08) },
    { label: "Smart TV", value: Math.round(visitors * 0.01) },
  ];
  const browsers: Distribution[] = [
    { label: "Chrome", value: Math.round(visitors * 0.61) },
    { label: "Safari", value: Math.round(visitors * 0.22) },
    { label: "Edge", value: Math.round(visitors * 0.09) },
    { label: "Firefox", value: Math.round(visitors * 0.05) },
    { label: "Opera", value: Math.round(visitors * 0.03) },
  ];
  const countries = [
    { label: "India", code: "IN", value: Math.round(visitors * 0.86) },
    { label: "UAE", code: "AE", value: Math.round(visitors * 0.06) },
    { label: "Singapore", code: "SG", value: Math.round(visitors * 0.03) },
    { label: "UK", code: "GB", value: Math.round(visitors * 0.025) },
    { label: "Canada", code: "CA", value: Math.round(visitors * 0.015) },
    { label: "USA", code: "US", value: Math.round(visitors * 0.01) },
  ];

  const topPages: TopPage[] = [
    { path: "/", title: "Landing Page", views: Math.round(visitors * 0.98), avgTimeMs: 142000, bounceRate: 38.9, conversions: leads },
    { path: "/#spaces", title: "Office & Retail", views: Math.round(visitors * 0.54), avgTimeMs: 61000, bounceRate: 22.1, conversions: Math.round(leads * 0.34) },
    { path: "/#amenities", title: "Amenities", views: Math.round(visitors * 0.47), avgTimeMs: 54000, bounceRate: 19.8, conversions: Math.round(leads * 0.22) },
    { path: "/#location", title: "Location", views: Math.round(visitors * 0.39), avgTimeMs: 48000, bounceRate: 24.5, conversions: Math.round(leads * 0.18) },
    { path: "/#enquire", title: "Lead Form", views: Math.round(visitors * 0.24), avgTimeMs: 88000, bounceRate: 12.2, conversions: Math.round(leads * 0.7) },
  ];

  return {
    metrics, funnel, sources,
    timeseries: mockTimeseries(range),
    devices, browsers, countries, topPages,
    recentLeads: mockLeads().slice(0, 10),
  };
}

export function mockTimeseries(range: DateRange): TimePoint[] {
  const gen = mulberry32(range.length * 97 + 7);
  const wobble = (base: number) => Math.round(base * (0.6 + gen() * 0.9));
  if (range === "today" || range === "yesterday") {
    return Array.from({ length: 24 }, (_, h) => {
      const peak = Math.exp(-Math.pow((h - 14) / 5, 2));
      const v = wobble(20 + peak * 120);
      return { label: `${String(h).padStart(2, "0")}:00`, visitors: v, sessions: Math.round(v * 1.25), leads: Math.round(v * 0.07) };
    });
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const v = wobble(160 + (i / days) * 120);
    return {
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      visitors: v, sessions: Math.round(v * 1.26), leads: Math.round(v * 0.075),
    };
  });
}

export function mockLeadStats(): LeadStats {
  const leads = mockLeads();
  const today = leads.filter((l) => Date.now() - +new Date(l.createdAt) < 86400000).length;
  return {
    total: leads.length,
    today,
    qualified: leads.filter((l) => ["QUALIFIED", "INTERESTED", "SITE_VISIT_SCHEDULED", "NEGOTIATION"].includes(l.status)).length,
    won: leads.filter((l) => l.status === "WON").length,
    lost: leads.filter((l) => l.status === "LOST").length,
    conversionRate: 5.9,
  };
}

export function mockSessionStats(): SessionStats {
  const sessions = mockSessions();
  return {
    total: 1610,
    live: sessions.filter((s) => s.status === "ACTIVE").length,
    returning: Math.round(sessions.length * 0.32),
    avgDurationMs: 138000,
    bounceRate: 38.9,
  };
}

export function mockTechStack(): TechStackData {
  const total = 12800;
  const dist = (pairs: [string, number][]): Distribution[] =>
    pairs.map(([label, p]) => ({ label, value: Math.round(total * p) }));
  return {
    devices: dist([["Mobile", 0.58], ["Desktop", 0.33], ["Tablet", 0.08], ["Smart TV", 0.01]]),
    browsers: dist([["Chrome", 0.61], ["Safari", 0.22], ["Edge", 0.09], ["Firefox", 0.05], ["Opera", 0.03]]),
    os: dist([["Android", 0.44], ["Windows", 0.24], ["iOS", 0.18], ["macOS", 0.1], ["Linux", 0.04]]),
    resolutions: dist([["390×844", 0.28], ["1920×1080", 0.21], ["412×915", 0.16], ["1366×768", 0.14], ["1440×900", 0.12], ["768×1024", 0.09]]),
    networks: dist([["4G", 0.41], ["WiFi", 0.34], ["5G", 0.15], ["Broadband", 0.08], ["3G", 0.02]]),
    languages: dist([["en-IN", 0.52], ["hi-IN", 0.24], ["mr-IN", 0.12], ["en-US", 0.08], ["en-GB", 0.04]]),
  };
}

/* ── Heatmap ──────────────────────────────────────────────────────────────── */
const HOT_ZONES: { x: number; y: number; label: string; weight: number }[] = [
  { x: 0.32, y: 0.13, label: "Hero — Get Price & Floor Plan", weight: 1 },
  { x: 0.68, y: 0.16, label: "Hero — lead form", weight: 0.85 },
  { x: 0.28, y: 0.15, label: "Hero — Call Now", weight: 0.6 },
  { x: 0.5, y: 0.31, label: "Why Blanca cards", weight: 0.45 },
  { x: 0.5, y: 0.46, label: "Spaces — Get Details", weight: 0.7 },
  { x: 0.5, y: 0.6, label: "Amenities carousel", weight: 0.4 },
  { x: 0.5, y: 0.74, label: "Location — map", weight: 0.35 },
  { x: 0.5, y: 0.86, label: "Lead form — Submit", weight: 0.9 },
  { x: 0.88, y: 0.97, label: "WhatsApp sticky", weight: 0.75 },
  { x: 0.12, y: 0.97, label: "Call sticky", weight: 0.55 },
];

export function mockHeatPoints(): HeatPoint[] {
  const pts: HeatPoint[] = [];
  const g = mulberry32(4242);
  for (const z of HOT_ZONES) {
    const n = 4 + Math.round(z.weight * 8);
    for (let k = 0; k < n; k++) {
      const intensity = Math.min(1, z.weight * (0.6 + g() * 0.5));
      const clicks = Math.round(intensity * 900 + g() * 60);
      pts.push({
        relX: Math.min(0.98, Math.max(0.02, z.x + (g() - 0.5) * 0.08)),
        relY: Math.min(0.99, Math.max(0.01, z.y + (g() - 0.5) * 0.05)),
        intensity,
        clicks,
        visitors: Math.round(clicks * (0.6 + g() * 0.3)),
        conversion: +(intensity * 9 + g() * 3).toFixed(1),
        avgTimeMs: Math.round(4000 + g() * 40000),
        label: z.label,
      });
    }
  }
  return pts;
}

export function mockScrollBuckets(): ScrollBucket[] {
  return [
    { pct: 0, reached: 100 },
    { pct: 25, reached: 82 },
    { pct: 50, reached: 63 },
    { pct: 75, reached: 41 },
    { pct: 100, reached: 24 },
  ];
}

export function mockHoverElements(): HoverElement[] {
  return [
    { label: "Get Price & Floor Plan (Hero)", hovers: 4210, kind: "Button" },
    { label: "Lead form — Name field", hovers: 3180, kind: "Form" },
    { label: "Office Spaces card", hovers: 2740, kind: "Card" },
    { label: "Amenities gallery", hovers: 2210, kind: "Image" },
    { label: "Where Business Meets Luxury", hovers: 1980, kind: "Heading" },
    { label: "WhatsApp sticky button", hovers: 1760, kind: "Button" },
    { label: "Retail Outlets card", hovers: 1520, kind: "Card" },
    { label: "Submit — Get Details", hovers: 1340, kind: "Button" },
  ];
}
