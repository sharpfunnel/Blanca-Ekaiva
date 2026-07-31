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
  DateRange,
  HeatPoint,
  HoverElement,
  Lead,
  LeadStats,
  OverviewData,
  ScrollBucket,
  SessionRow,
  SessionStats,
  TechStackData,
} from "./types";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
