/**
 * Data access for the admin panel.
 *
 * Right now every function returns the mock dataset after a short delay so the
 * skeleton/loading states are exercised. When the database is wired, swap each
 * body for a `fetch("/api/admin/...")` — the return types are identical, so no
 * page or component has to change.
 */
import {
  mockHeatPoints,
  mockHoverElements,
  mockLeads,
  mockLeadStats,
  mockOverview,
  mockScrollBuckets,
  mockSessions,
  mockSessionStats,
  mockTechStack,
} from "./mock";
import type {
  CampaignDetail,
  CampaignRow,
  CapiDelivery,
  CtaStat,
  DateRange,
  ErrorRow,
  MetaAccountStatus,
  FormStat,
  FunnelsData,
  HeatPoint,
  HoverElement,
  Lead,
  LeadStats,
  OverviewData,
  ScrollBucket,
  SessionRow,
  SessionStats,
  TechStackData,
  VitalStat,
} from "./types";

/** Window selector shared by the engagement dashboards. */
export type EngagementRange = "7d" | "30d" | "90d" | "all";

// Live: the admin now reads real data captured from landing-page visitors.
// (Set to true only to preview the panel with sample data.)
const USE_MOCK = false;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const queryKeys = {
  overview: (range: DateRange) => ["admin", "overview", range] as const,
  leads: () => ["admin", "leads"] as const,
  leadStats: () => ["admin", "leadStats"] as const,
  sessions: () => ["admin", "sessions"] as const,
  sessionStats: () => ["admin", "sessionStats"] as const,
  heatmap: () => ["admin", "heatmap"] as const,
  techStack: () => ["admin", "techStack"] as const,
  funnels: (range: EngagementRange) => ["admin", "funnels", range] as const,
  ctas: (range: EngagementRange) => ["admin", "ctas", range] as const,
  forms: (range: EngagementRange) => ["admin", "forms", range] as const,
  performance: (range: EngagementRange) => ["admin", "performance", range] as const,
  errors: (range: EngagementRange) => ["admin", "errors", range] as const,
  campaigns: (range: EngagementRange) => ["admin", "campaigns", range] as const,
  campaign: (id: string) => ["admin", "campaign", id] as const,
  capiLog: () => ["admin", "capiLog"] as const,
  live: () => ["admin", "live"] as const,
};

export async function getOverview(range: DateRange): Promise<OverviewData> {
  if (USE_MOCK) {
    await delay(280);
    return mockOverview(range);
  }
  return fetchJson(`/api/admin/overview?range=${range}`);
}

export async function getLeads(): Promise<Lead[]> {
  if (USE_MOCK) {
    await delay(260);
    return mockLeads();
  }
  return fetchJson(`/api/admin/leads`);
}

export async function getLeadStats(): Promise<LeadStats> {
  if (USE_MOCK) {
    await delay(200);
    return mockLeadStats();
  }
  return fetchJson(`/api/admin/leads/stats`);
}

export async function getSessions(): Promise<SessionRow[]> {
  if (USE_MOCK) {
    await delay(260);
    return mockSessions();
  }
  return fetchJson(`/api/admin/sessions`);
}

export async function getSessionStats(): Promise<SessionStats> {
  if (USE_MOCK) {
    await delay(200);
    return mockSessionStats();
  }
  return fetchJson(`/api/admin/sessions/stats`);
}

export interface HeatmapData {
  points: HeatPoint[];
  scroll: ScrollBucket[];
  hover: HoverElement[];
}

export async function getHeatmap(): Promise<HeatmapData> {
  if (USE_MOCK) {
    await delay(300);
    return {
      points: mockHeatPoints(),
      scroll: mockScrollBuckets(),
      hover: mockHoverElements(),
    };
  }
  return fetchJson(`/api/admin/heatmap`);
}

export async function getTechStack(): Promise<TechStackData> {
  if (USE_MOCK) {
    await delay(240);
    return mockTechStack();
  }
  return fetchJson(`/api/admin/tech-stack`);
}

/* ── Engagement dashboards ────────────────────────────────────────────────── */

export async function getFunnels(range: EngagementRange): Promise<FunnelsData> {
  return fetchJson(`/api/admin/funnels?range=${range}`);
}

export async function getCtas(range: EngagementRange): Promise<CtaStat[]> {
  return fetchJson(`/api/admin/ctas?range=${range}`);
}

export async function getForms(range: EngagementRange): Promise<FormStat[]> {
  return fetchJson(`/api/admin/forms?range=${range}`);
}

export async function getPerformance(
  range: EngagementRange
): Promise<VitalStat[]> {
  return fetchJson(`/api/admin/performance?range=${range}`);
}

export async function getErrors(range: EngagementRange): Promise<ErrorRow[]> {
  return fetchJson(`/api/admin/errors?range=${range}`);
}

/** Sessions active in the last five minutes. */
export async function getLiveCount(): Promise<{ count: number }> {
  return fetchJson(`/api/admin/live`);
}

/* ── Meta Ads ─────────────────────────────────────────────────────────────── */

export async function getCampaigns(
  range: EngagementRange
): Promise<{ account: MetaAccountStatus; campaigns: CampaignRow[] }> {
  return fetchJson(`/api/admin/campaigns?range=${range}`);
}

export async function getCampaign(
  id: string,
  range: EngagementRange
): Promise<CampaignDetail> {
  return fetchJson(
    `/api/admin/campaigns/${encodeURIComponent(id)}?range=${range}`
  );
}

export async function getMetaOverview(): Promise<{
  account: MetaAccountStatus | null;
  deliveries: CapiDelivery[];
}> {
  return fetchJson(`/api/admin/meta`);
}

/** Triggers a sync now rather than waiting for the cron. */
export async function syncMetaNow(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/meta", { method: "POST" });
  return res.json();
}

/** Full rrweb event stream for a session (real session replay). */
export async function getReplay(
  sessionId: string
): Promise<{ events: unknown[] }> {
  if (USE_MOCK) {
    await delay(200);
    return { events: [] };
  }
  return fetchJson(`/api/admin/replay?sessionId=${encodeURIComponent(sessionId)}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
