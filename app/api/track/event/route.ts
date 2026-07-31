import { prisma } from "@/lib/prisma";
import { ensureSession } from "@/lib/track/server";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "PAGEVIEW", "CLICK", "RAGE_CLICK", "CTA_CLICK", "ANCHOR_CLICK",
  "PHONE_CLICK", "WHATSAPP_CLICK", "EMAIL_CLICK", "DOWNLOAD_BROCHURE",
  "BOOK_SITE_VISIT", "FORM_OPEN", "FORM_CLOSE", "FORM_START", "FORM_SUBMIT",
  "SECTION_VIEW", "SCROLL", "VIDEO_PLAY", "IMAGE_CLICK", "OUTBOUND_LINK", "HOVER",
]);
const CLICK_TYPES = new Set([
  "CLICK", "CTA_CLICK", "ANCHOR_CLICK", "PHONE_CLICK", "WHATSAPP_CLICK",
  "EMAIL_CLICK", "IMAGE_CLICK", "OUTBOUND_LINK", "BOOK_SITE_VISIT", "DOWNLOAD_BROCHURE",
]);

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
  meta?: Record<string, unknown>;
}

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta: (e.meta ?? undefined) as any,
        })),
      });
    }

    const clicks = valid.filter((e) => CLICK_TYPES.has(e.type)).length;
    const pageViews = valid.filter((e) => e.type === "PAGEVIEW").length;
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
