/**
 * Blanca visitor tracking SDK (client).
 *
 * Captures the real behaviour of landing-page visitors and posts it to the
 * /api/track/* ingestion routes:
 *   • session init (device, screen, referrer, UTM, language, timezone)
 *   • clicks with absolute + relative coordinates (powers the click heatmap)
 *   • scroll depth milestones (powers the scroll heatmap + funnel)
 *   • section visibility, CTA / phone / WhatsApp / email / form events
 *   • full rrweb DOM recording for session replay
 *
 * Everything is wrapped so a tracking failure can never break the page.
 */
import { record } from "rrweb";
import type { eventWithTime } from "@rrweb/types";

import { initCtaCollector } from "@/lib/track/collectors/cta";
import { initErrorCollector } from "@/lib/track/collectors/errors";
import { initFormCollector } from "@/lib/track/collectors/forms";
import { initMouseCollector } from "@/lib/track/collectors/mouse";
import { initVitalsCollector } from "@/lib/track/collectors/vitals";
import type {
  TrackError,
  TrackEvent,
  TrackEventType,
  TrackerContext,
  TrackVital,
} from "@/lib/track/types";

const SESSION_TTL = 30 * 60 * 1000; // 30 min inactivity ends a session

type EventType = TrackEventType;

declare global {
  interface Window {
    __blancaTrack?: { sessionId: string; visitorId: string };
    __blancaTrackInit?: boolean;
  }
}

const uid = () =>
  (crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

function getVisitorId(): { id: string; returning: boolean } {
  try {
    const existing = localStorage.getItem("blanca_vid");
    if (existing) return { id: existing, returning: true };
    const id = `VS-${uid()}`;
    localStorage.setItem("blanca_vid", id);
    return { id, returning: false };
  } catch {
    return { id: `VS-${uid()}`, returning: false };
  }
}

function getSessionId(): string {
  try {
    const raw = sessionStorage.getItem("blanca_sid");
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; last: number };
      if (now - parsed.last < SESSION_TTL) {
        sessionStorage.setItem("blanca_sid", JSON.stringify({ id: parsed.id, last: now }));
        return parsed.id;
      }
    }
    const id = `SS-${uid()}`;
    sessionStorage.setItem("blanca_sid", JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return `SS-${uid()}`;
  }
}

function selectorFor(el: Element | null): string {
  if (!el) return "";
  if (el.id) return `#${el.id}`;
  const cls =
    typeof el.className === "string" && el.className
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
  return `${el.tagName.toLowerCase()}${cls}`.slice(0, 120);
}

function classifyClick(target: Element): { type: EventType; text: string } {
  const link = target.closest("a") as HTMLAnchorElement | null;
  const btn = target.closest("button");
  const field = target.closest("input, select, textarea");
  const el = link || btn || field || target;
  let text = (el.textContent || "").trim().slice(0, 80);
  // Form fields have no text — use a human label instead of the React id.
  if (!text && field) {
    const labelEl = field.id
      ? field.ownerDocument.querySelector(`label[for="${field.id}"]`)
      : null;
    text =
      field.getAttribute("aria-label") ||
      labelEl?.textContent?.trim() ||
      field.getAttribute("placeholder") ||
      field.getAttribute("name") ||
      "Form field";
    text = text.slice(0, 80);
  }
  const href = link?.getAttribute("href") || "";

  if (/^tel:/i.test(href)) return { type: "PHONE_CLICK", text };
  if (/wa\.me|whatsapp/i.test(href)) return { type: "WHATSAPP_CLICK", text };
  if (/^mailto:/i.test(href)) return { type: "EMAIL_CLICK", text };
  if (/brochure|floor.?plan\.pdf|\.pdf/i.test(href))
    return { type: "DOWNLOAD_BROCHURE", text };
  if (/site.?visit|book/i.test(text)) return { type: "BOOK_SITE_VISIT", text };
  if (/get price|floor plan|get details|enquire|callback|get office|get retail/i.test(text))
    return { type: "CTA_CLICK", text };
  if (link && /^https?:/i.test(href) && !href.includes(location.host))
    return { type: "OUTBOUND_LINK", text };
  if (link) return { type: "ANCHOR_CLICK", text };
  return { type: "CLICK", text };
}

interface EntryMeta {
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  fbclid: string;
  msclkid: string;
  placement: string;
  metaCampaignId: string;
  metaAdsetId: string;
  metaAdId: string;
  /** Every query param on the landing URL, verbatim — a catch-all so no
   *  acquisition signal is lost even if it isn't one of the named fields. */
  rawParams: Record<string, string>;
}

const ENTRY_META_KEY = "blanca_smeta";

/**
 * Acquisition params, captured ONCE per session and cached in sessionStorage.
 * Reading once (not per pageview) means a visitor who lands with UTM params and
 * then clicks to a query-less internal page keeps their original attribution.
 */
function getEntryMeta(): EntryMeta {
  try {
    const existing = sessionStorage.getItem(ENTRY_META_KEY);
    if (existing) return JSON.parse(existing) as EntryMeta;
  } catch {
    // storage blocked (private mode / in-app webview) → capture without caching
  }

  const p = new URLSearchParams(location.search);
  const meta: EntryMeta = {
    referrer: document.referrer || "",
    utmSource: p.get("utm_source") || "",
    utmMedium: p.get("utm_medium") || "",
    utmCampaign: p.get("utm_campaign") || "",
    utmTerm: p.get("utm_term") || "",
    utmContent: p.get("utm_content") || "",
    gclid: p.get("gclid") || "",
    fbclid: p.get("fbclid") || "",
    msclkid: p.get("msclkid") || "",
    placement: p.get("placement") || "",
    metaCampaignId: p.get("campaign_id") || "",
    metaAdsetId: p.get("adset_id") || "",
    metaAdId: p.get("ad_id") || "",
    rawParams: Object.fromEntries(p.entries()),
  };

  try {
    sessionStorage.setItem(ENTRY_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore storage failures */
  }
  return meta;
}

export function initTracker() {
  if (typeof window === "undefined" || window.__blancaTrackInit) return;

  // Never record inside an iframe (e.g. the admin heatmap preview) or when the
  // page is loaded purely as a heatmap backdrop — that would create fake data.
  try {
    if (window.top !== window.self) return;
    if (new URLSearchParams(location.search).get("heatmap") === "1") return;
  } catch {
    return; // cross-origin top access means we are framed → skip
  }

  window.__blancaTrackInit = true;

  const path = location.pathname + location.hash;
  const { id: visitorId, returning } = getVisitorId();
  const sessionId = getSessionId();
  window.__blancaTrack = { sessionId, visitorId };

  /**
   * `unload = false` (in-session): a plain fetch with NO keepalive, so there is
   * no ~64KB payload cap — full DOM snapshots (which routinely exceed 64KB) are
   * sent intact. `unload = true` (page closing): sendBeacon / keepalive fetch,
   * both capped at ~64KB, which is fine because in-session flushes have already
   * persisted the large snapshot and only small deltas remain.
   */
  const post = (url: string, body: unknown, unload = false) => {
    try {
      const json = JSON.stringify(body);
      if (unload) {
        if (
          navigator.sendBeacon?.(url, new Blob([json], { type: "application/json" }))
        )
          return;
        void fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
          keepalive: true,
        }).catch(() => {});
        return;
      }
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      }).catch(() => {});
    } catch {
      /* never break the page */
    }
  };

  // ── Session init ─────────────────────────────────────────────────────────
  const entry = getEntryMeta();
  post("/api/track/session", {
    sessionId,
    visitorId,
    returning,
    referrer: entry.referrer,
    landingPage: path,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenW: screen.width,
    screenH: screen.height,
    viewportW: innerWidth,
    viewportH: innerHeight,
    utmSource: entry.utmSource,
    utmMedium: entry.utmMedium,
    utmCampaign: entry.utmCampaign,
    utmTerm: entry.utmTerm,
    utmContent: entry.utmContent,
    gclid: entry.gclid,
    fbclid: entry.fbclid,
    msclkid: entry.msclkid,
    placement: entry.placement,
    metaCampaignId: entry.metaCampaignId,
    metaAdsetId: entry.metaAdsetId,
    metaAdId: entry.metaAdId,
    rawParams: entry.rawParams,
  });

  // ── Event batching ───────────────────────────────────────────────────────
  // Three lanes, one request. Behavioural events, Core Web Vitals and errors
  // have nothing in common except when they are sent, so they ride together
  // rather than each getting its own endpoint.
  let buffer: TrackEvent[] = [];
  let vitalsBuffer: TrackVital[] = [];
  let errorsBuffer: TrackError[] = [];
  const started = Date.now();
  const flush = (beacon = false) => {
    if (!buffer.length && !vitalsBuffer.length && !errorsBuffer.length) return;
    const batch = buffer;
    const vitals = vitalsBuffer;
    const errors = errorsBuffer;
    buffer = [];
    vitalsBuffer = [];
    errorsBuffer = [];
    post(
      "/api/track/event",
      {
        sessionId,
        visitorId,
        path,
        durationMs: Date.now() - started,
        events: batch,
        vitals,
        errors,
      },
      beacon
    );
  };
  const track = (e: Omit<TrackEvent, "ts" | "path"> & { path?: string }) =>
    buffer.push({ ...e, path: e.path ?? path, ts: Date.now() });

  track({ type: "PAGEVIEW" });

  // ── Collectors ───────────────────────────────────────────────────────────
  const unloadHandlers: (() => void)[] = [];
  const ctx: TrackerContext = {
    track,
    vital: (v) => vitalsBuffer.push(v),
    error: (e) => {
      errorsBuffer.push(e);
      // An error often precedes the visitor giving up and closing the tab.
      flush();
    },
    flush,
    onUnload: (fn) => unloadHandlers.push(fn),
  };

  const runUnloadHandlers = () => {
    for (const fn of unloadHandlers) {
      try {
        fn();
      } catch {
        /* one bad handler must not stop the others or the final flush */
      }
    }
  };

  const docSize = () => ({
    w: Math.max(document.documentElement.scrollWidth, innerWidth),
    h: Math.max(document.documentElement.scrollHeight, innerHeight),
  });

  // ── Clicks ───────────────────────────────────────────────────────────────
  addEventListener(
    "click",
    (ev) => {
      const target = ev.target as Element | null;
      if (!target) return;
      const tagged = target.closest<HTMLElement>("[data-cta-id]");
      const { type, text } = classifyClick(target);
      const { w, h } = docSize();
      const pageX = ev.pageX;
      const pageY = ev.pageY;
      track({
        // A `data-cta-id` is an explicit declaration that this element is a
        // CTA, so it outranks whatever the href/text heuristic guessed.
        type: tagged ? "CTA_CLICK" : type,
        ctaId: tagged?.dataset.ctaId,
        selector: selectorFor(target.closest("a,button") || target),
        text,
        x: ev.clientX,
        y: ev.clientY,
        pageX,
        pageY,
        relX: +(pageX / w).toFixed(4),
        relY: +(pageY / h).toFixed(4),
        vpW: innerWidth,
        vpH: innerHeight,
      });
      if (buffer.length >= 8) flush();
    },
    { capture: true, passive: true }
  );

  // ── Scroll depth milestones ──────────────────────────────────────────────
  const milestones = [25, 50, 75, 100];
  const seen = new Set<number>();
  let maxScroll = 0;
  let scrollRaf = 0;
  addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const { h } = docSize();
        const pct = Math.min(100, Math.round(((scrollY + innerHeight) / h) * 100));
        if (pct > maxScroll) maxScroll = pct;
        for (const m of milestones) {
          if (pct >= m && !seen.has(m)) {
            seen.add(m);
            track({ type: "SCROLL", scrollPct: m });
          }
        }
      });
    },
    { passive: true }
  );

  // ── Section visibility ───────────────────────────────────────────────────
  try {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            track({ type: "SECTION_VIEW", selector: `#${e.target.id}`, meta: { id: e.target.id } });
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll("section[id], [data-section]").forEach((s) => io.observe(s));
  } catch {
    /* IO unsupported — skip section tracking */
  }

  // ── Modular collectors ───────────────────────────────────────────────────
  // Form engagement (open/start/field-level/submit/abandon) lives in the forms
  // collector; CTA view/hover in the CTA collector; frustration signals and the
  // hover heatmap in the mouse collector. Each is independently skippable and
  // none of them can throw into the others.
  const collectors: [string, () => void][] = [
    ["cta", () => initCtaCollector(ctx)],
    ["forms", () => initFormCollector(ctx)],
    ["mouse", () => initMouseCollector(ctx, { selectorFor, docSize })],
    ["vitals", () => initVitalsCollector(ctx)],
    ["errors", () => initErrorCollector(ctx)],
  ];
  for (const [, init] of collectors) {
    try {
      init();
    } catch {
      /* a collector that cannot start must not take the others with it */
    }
  }

  // ── Periodic flush + on hide ─────────────────────────────────────────────
  const interval = setInterval(() => flush(), 8_000);
  addEventListener("visibilitychange", () => {
    // A hidden tab may still resume; a plain fetch is uncapped and reliable here.
    if (document.visibilityState === "hidden") flush();
  });
  addEventListener("pagehide", () => {
    clearInterval(interval);
    // Abandonment and other end-of-visit events are produced here, so they must
    // be queued before the final flush, not after it.
    runUnloadHandlers();
    flush(true);
  });

  // ── rrweb session replay ─────────────────────────────────────────────────
  try {
    let replayBuf: eventWithTime[] = [];
    let seq = 0;
    let snapshotSent = false;
    const flushReplay = (unload = false) => {
      if (!replayBuf.length) return;
      const chunk = replayBuf;
      replayBuf = [];
      snapshotSent = true;
      post("/api/track/replay", { sessionId, visitorId, seq: seq++, events: chunk }, unload);
    };
    record({
      emit: (e) => {
        replayBuf.push(e);
        // Flush the very first batch (the meta + full DOM snapshot) as soon as
        // it lands, via the uncapped in-session fetch, so it is never dropped.
        if (!snapshotSent && replayBuf.length >= 2) flushReplay();
        else if (replayBuf.length >= 50) flushReplay();
      },
      sampling: { mousemove: 50, scroll: 100, input: "last" },
      maskAllInputs: true, // never record what visitors type into the lead form
      recordCanvas: false,
      checkoutEveryNms: 120_000,
    });
    // Safety net in case the page produced fewer than 2 events by first tick.
    setTimeout(() => flushReplay(), 2_500);
    const replayInterval = setInterval(() => flushReplay(), 6_000);
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushReplay();
    });
    addEventListener("pagehide", () => {
      clearInterval(replayInterval);
      flushReplay(true);
    });
  } catch {
    /* replay optional — capture the rest regardless */
  }
}
