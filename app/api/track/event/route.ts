import { prisma } from "@/lib/prisma";
import { ensureSession } from "@/lib/track/server";
import type { TrackError, TrackVital } from "@/lib/track/types";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "PAGEVIEW", "CLICK", "RAGE_CLICK", "DEAD_CLICK", "CTA_VIEW", "CTA_HOVER",
  "CTA_CLICK", "ANCHOR_CLICK", "PHONE_CLICK", "WHATSAPP_CLICK", "EMAIL_CLICK",
  "DOWNLOAD_BROCHURE", "BOOK_SITE_VISIT", "FORM_OPEN", "FORM_CLOSE",
  "FORM_START", "FORM_SUBMIT", "FORM_ABANDON", "FIELD_FOCUS", "FIELD_COMPLETE",
  "VALIDATION_ERROR", "SECTION_VIEW", "SCROLL", "VIDEO_PLAY", "IMAGE_CLICK",
  "OUTBOUND_LINK", "HOVER",
]);
const CLICK_TYPES = new Set([
  "CLICK", "CTA_CLICK", "ANCHOR_CLICK", "PHONE_CLICK", "WHATSAPP_CLICK",
  "EMAIL_CLICK", "IMAGE_CLICK", "OUTBOUND_LINK", "BOOK_SITE_VISIT", "DOWNLOAD_BROCHURE",
]);
const VITAL_NAMES = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);
const VITAL_RATINGS = new Set(["GOOD", "NEEDS_IMPROVEMENT", "POOR"]);
const ERROR_KINDS = new Set(["JS_ERROR", "UNHANDLED_REJECTION", "RESOURCE_ERROR"]);

interface InEvent {
  type: string;
  path?: string;
  selector?: string;
  text?: string;
  x?: number;
  y?: number;
  pageX?: number;
  pageY?: number;
  relX?: number;
  relY?: number;
  vpW?: number;
  vpH?: number;
  scrollPct?: number;
  ctaId?: string;
  formId?: string;
  fieldName?: string;
  meta?: Record<string, unknown>;
}

const str = (v: unknown, max: number) =>
  typeof v === "string" && v ? v.slice(0, max) : null;

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b?.sessionId || !b?.visitorId) {
      return Response.json({ ok: false }, { status: 200 });
    }
    await ensureSession(b.sessionId, b.visitorId);

    const events: InEvent[] = Array.isArray(b.events) ? b.events : [];
    const valid = events.filter((e) => ALLOWED.has(e.type));

    if (valid.length) {
      await prisma.event.createMany({
        data: valid.map((e) => ({
          sessionId: b.sessionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: e.type as any,
          path: e.path || b.path || "/",
          selector: e.selector ?? null,
          text: e.text ?? null,
          x: e.x ?? null,
          y: e.y ?? null,
          pageX: e.pageX ?? null,
          pageY: e.pageY ?? null,
          relX: e.relX ?? null,
          relY: e.relY ?? null,
          vpW: e.vpW ?? null,
          vpH: e.vpH ?? null,
          scrollPct: e.scrollPct ?? null,
          ctaId: str(e.ctaId, 80),
          formId: str(e.formId, 80),
          fieldName: str(e.fieldName, 60),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta: (e.meta ?? undefined) as any,
        })),
      });
    }

    // ── Core Web Vitals ────────────────────────────────────────────────────
    const vitals: TrackVital[] = Array.isArray(b.vitals) ? b.vitals : [];
    const validVitals = vitals.filter(
      (v) =>
        VITAL_NAMES.has(v?.name) &&
        VITAL_RATINGS.has(v?.rating) &&
        typeof v?.value === "number" &&
        Number.isFinite(v.value)
    );
    if (validVitals.length) {
      await prisma.performanceMetric.createMany({
        data: validVitals.map((v) => ({
          sessionId: b.sessionId,
          name: v.name,
          value: v.value,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rating: v.rating as any,
          path: v.path || b.path || "/",
        })),
      });
    }

    // ── Client-side errors ─────────────────────────────────────────────────
    const errors: TrackError[] = Array.isArray(b.errors) ? b.errors : [];
    const validErrors = errors.filter(
      (e) => ERROR_KINDS.has(e?.kind) && typeof e?.message === "string" && e.message
    );
    if (validErrors.length) {
      await prisma.errorEvent.createMany({
        data: validErrors.map((e) => ({
          sessionId: b.sessionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          kind: e.kind as any,
          message: e.message.slice(0, 500),
          source: str(e.source, 300),
          lineNo: typeof e.lineNo === "number" ? e.lineNo : null,
          colNo: typeof e.colNo === "number" ? e.colNo : null,
          stack: str(e.stack, 2000),
          path: e.path || b.path || "/",
        })),
      });
    }

    const clicks = valid.filter((e) => CLICK_TYPES.has(e.type)).length;
    const pageViews = valid.filter((e) => e.type === "PAGEVIEW").length;
    const hovers = valid.filter((e) => e.type === "HOVER").length;
    const scrolls = valid
      .filter((e) => typeof e.scrollPct === "number")
      .map((e) => e.scrollPct as number);
    const batchMax = scrolls.length ? Math.max(...scrolls) : 0;

    const cur = await prisma.session.findUnique({
      where: { sessionId: b.sessionId },
      select: { maxScrollPct: true, clicks: true },
    });
    const newMax = Math.max(cur?.maxScrollPct ?? 0, batchMax);

    await prisma.session.update({
      where: { sessionId: b.sessionId },
      data: {
        lastActiveAt: new Date(),
        durationMs: typeof b.durationMs === "number" ? b.durationMs : undefined,
        currentPage: b.path || undefined,
        clicks: { increment: clicks },
        pageViews: { increment: pageViews },
        // The hover sampler is throttled to one point every 1.5s, so this is a
        // proxy for "time spent moving the mouse", not a raw mousemove count.
        mouseMoves: { increment: hovers },
        maxScrollPct: newMax,
        avgScrollPct: newMax,
        ...(valid.some((e) => e.type === "CTA_CLICK") ? { ctaClicked: true } : {}),
        ...(valid.some((e) => e.type === "FORM_START") ? { formStarted: true } : {}),
        ...(valid.some((e) => e.type === "FORM_SUBMIT")
          ? { formSubmitted: true }
          : {}),
        isBounce: !((cur?.clicks ?? 0) + clicks > 0 || newMax >= 50),
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
