import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/prisma";

export interface ClientMeta {
  device: "DESKTOP" | "MOBILE" | "TABLET" | "SMART_TV" | "BOT" | "UNKNOWN";
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
}

export function parseUA(ua: string): ClientMeta {
  try {
    const r = UAParser(ua);
    const t = r.device.type;
    const device =
      t === "mobile"
        ? "MOBILE"
        : t === "tablet"
          ? "TABLET"
          : t === "smarttv"
            ? "SMART_TV"
            : t === undefined
              ? "DESKTOP"
              : "UNKNOWN";
    return {
      device,
      os: r.os.name || "",
      osVersion: r.os.version || "",
      browser: r.browser.name || "",
      browserVersion: r.browser.version || "",
    };
  } catch {
    return { device: "UNKNOWN", os: "", osVersion: "", browser: "", browserVersion: "" };
  }
}

export function geoFromHeaders(h: Headers) {
  const ip =
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    "";
  return {
    ip,
    countryCode: h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || "",
    country: h.get("x-vercel-ip-country") || "",
    city: decodeURIComponent(h.get("x-vercel-ip-city") || ""),
    region: h.get("x-vercel-ip-country-region") || "",
  };
}

/** Derive a friendly traffic source/medium from UTM + referrer. */
export function deriveSource(
  referrer: string,
  utm: { source?: string; medium?: string; campaign?: string }
) {
  if (utm.source) {
    return {
      trafficSource: cap(utm.source),
      trafficMedium: utm.medium || "referral",
      campaign: utm.campaign || "(not set)",
    };
  }
  if (!referrer) return { trafficSource: "Direct", trafficMedium: "none", campaign: "(direct)" };
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    host = referrer;
  }
  if (host.includes(location_host())) return { trafficSource: "Direct", trafficMedium: "none", campaign: "(direct)" };
  const map: [RegExp, string, string][] = [
    [/google\./, "Google", "organic"],
    [/facebook\.|fb\./, "Facebook", "social"],
    [/instagram\./, "Instagram", "social"],
    [/t\.co|twitter|x\.com/, "Twitter/X", "social"],
    [/bing\./, "Bing", "organic"],
    [/wa\.me|whatsapp/, "WhatsApp", "social"],
    [/youtube\./, "YouTube", "social"],
    [/linkedin\./, "LinkedIn", "social"],
  ];
  for (const [re, src, med] of map) if (re.test(host)) return { trafficSource: src, trafficMedium: med, campaign: "(not set)" };
  return { trafficSource: host, trafficMedium: "referral", campaign: "(not set)" };
}

function location_host() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "localhost";
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Ensure a Visitor + Session row exist so events/replays satisfy the FK.
 *  Race-safe: the session-init and the first replay/event chunk can arrive
 *  concurrently, and two simultaneous upserts can still collide on the unique
 *  key — a P2002 there just means the row now exists, so it is safe to ignore. */
export async function ensureSession(sessionId: string, visitorId: string) {
  const ignoreConflict = (e: unknown) => {
    if ((e as { code?: string })?.code === "P2002") return;
    throw e;
  };
  await prisma.visitor
    .upsert({
      where: { visitorId },
      create: { visitorId },
      update: { lastSeenAt: new Date() },
    })
    .catch(ignoreConflict);
  await prisma.session
    .upsert({
      where: { sessionId },
      create: { sessionId, visitorId },
      update: { lastActiveAt: new Date() },
    })
    .catch(ignoreConflict);
}
