/** Shared data shapes for the admin panel. The mock layer and the eventual
 *  real API both return exactly these, so pages never change when data goes live. */

export type Trend = "up" | "down" | "flat";
export type MetricFormat = "number" | "percent" | "duration" | "currency";

export interface Metric {
  key: string;
  label: string;
  value: number;
  format: MetricFormat;
  delta: number; // percentage change vs previous period
  trend: Trend;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string;
  sessions: number;
  leads: number;
}

export interface TimePoint {
  label: string; // x-axis label
  visitors: number;
  sessions: number;
  leads: number;
}

export interface Distribution {
  label: string;
  value: number;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  avgTimeMs: number;
  bounceRate: number;
  conversions: number;
}

export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "SMART_TV";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "INTERESTED"
  | "SITE_VISIT_SCHEDULED"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "SPAM";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  budget: string;
  city: string;
  country: string;
  countryCode: string;
  source: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  placement: string;
  metaAdId: string;
  rawParams: Record<string, string> | null;
  device: DeviceType;
  browser: string;
  os: string;
  ip: string;
  status: LeadStatus;
  assignedTo: string;
  metaCapiSentAt: string | null; // ISO
  metaCapiError: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  journey: JourneyStep[];
  notes: LeadNote[];
}

export interface JourneyStep {
  at: string;
  label: string;
  detail?: string;
}

export interface LeadNote {
  at: string;
  author: string;
  body: string;
}

export type SessionStatus = "ACTIVE" | "IDLE" | "ENDED" | "BOUNCED";
export type VisitorType = "NEW" | "RETURNING";

export interface SessionRow {
  id: string;
  visitorId: string;
  visitorType: VisitorType;
  visitTime: string; // ISO
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  device: DeviceType;
  os: string;
  browser: string;
  screen: string;
  language: string;
  network: string;
  referrer: string;
  source: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  placement: string;
  gclid: string;
  fbclid: string;
  msclkid: string;
  metaCampaignId: string;
  rawParams: Record<string, string> | null;
  landingPage: string;
  currentPage: string;
  pageViews: number;
  durationMs: number;
  avgScroll: number;
  maxScroll: number;
  clicks: number;
  mouseMoves: number;
  formStarted: boolean;
  formSubmitted: boolean;
  ctaClicked: boolean;
  bounce: boolean;
  status: SessionStatus;
}

export interface HeatPoint {
  relX: number; // 0..1
  relY: number; // 0..1
  intensity: number; // 0..1
  clicks: number;
  visitors: number;
  conversion: number; // %
  avgTimeMs: number;
  label: string;
}

export interface ScrollBucket {
  pct: number; // 0,25,50,75,100
  reached: number; // % of users
}

export interface HoverElement {
  label: string;
  hovers: number;
  kind: "Button" | "Image" | "Card" | "Form" | "Heading";
}

export interface OverviewData {
  metrics: Metric[];
  funnel: FunnelStage[];
  sources: TrafficSource[];
  timeseries: TimePoint[];
  devices: Distribution[];
  browsers: Distribution[];
  countries: (Distribution & { code: string })[];
  topPages: TopPage[];
  recentLeads: Lead[];
}

export interface LeadStats {
  total: number;
  today: number;
  qualified: number;
  won: number;
  lost: number;
  conversionRate: number;
}

export interface SessionStats {
  total: number;
  live: number;
  returning: number;
  avgDurationMs: number;
  bounceRate: number;
}

export interface TechStackData {
  devices: Distribution[];
  browsers: Distribution[];
  os: Distribution[];
  resolutions: Distribution[];
  networks: Distribution[];
  languages: Distribution[];
}

export type DateRange = "today" | "yesterday" | "7d" | "30d" | "90d";

/* ── Engagement dashboards ────────────────────────────────────────────────── */

/** One `data-cta-id`, across the selected window. */
export interface CtaStat {
  ctaId: string;
  label: string;
  views: number;
  hovers: number;
  clicks: number;
  /** clicks ÷ views, as a percentage. */
  ctr: number;
  /** Sessions that clicked this CTA *and* converted. */
  leads: number;
  conversionRate: number;
}

/** One `data-form-id`, across the selected window. */
export interface FormStat {
  formId: string;
  views: number;
  starts: number;
  submits: number;
  abandons: number;
  validationErrors: number;
  /** starts ÷ views. */
  startRate: number;
  /** submits ÷ starts — the number that actually says whether a form works. */
  completionRate: number;
  /** Field with the most validation errors, or "" when there are none. */
  worstField: string;
}

export type VitalName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

export interface VitalStat {
  name: VitalName;
  good: number;
  needsImprovement: number;
  poor: number;
  /** 75th percentile — the number Google actually grades a site on. */
  p75: number;
  unit: "ms" | "score";
  samples: number;
}

export type ErrorKind = "JS_ERROR" | "UNHANDLED_REJECTION" | "RESOURCE_ERROR";

export interface ErrorRow {
  id: string;
  kind: ErrorKind;
  message: string;
  source: string;
  lineNo: number | null;
  path: string;
  browser: string;
  os: string;
  device: DeviceType | "UNKNOWN";
  /** How many times this same message+source was seen in the window. */
  count: number;
  lastSeen: string; // ISO
}

/** Both series for /admin/funnels: all traffic, and Meta-ads-only. */
export interface FunnelsData {
  all: FunnelStage[];
  meta: FunnelStage[];
}

/* ── Meta Ads ─────────────────────────────────────────────────────────────── */

export interface CampaignRow {
  campaignId: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results: number;
  costPerResult: number;
  /** Joined from our own tables, not from Meta. */
  sessions: number;
  leads: number;
  costPerLead: number;
  currency: string;
}

export interface CampaignChild {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  results: number;
}

export interface CampaignDetail {
  campaign: CampaignRow;
  adSets: CampaignChild[];
  ads: CampaignChild[];
  daily: { date: string; spend: number; clicks: number; leads: number }[];
}

export interface MetaAccountStatus {
  connected: boolean;
  accountId: string;
  name: string;
  currency: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  tokenExpiresAt: string | null;
}

/** One row of the CAPI delivery log on /admin/meta-capi. */
export interface CapiDelivery {
  leadId: string;
  name: string;
  phone: string;
  createdAt: string;
  sentAt: string | null;
  eventId: string | null;
  error: string | null;
}
