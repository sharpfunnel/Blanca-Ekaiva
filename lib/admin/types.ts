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
