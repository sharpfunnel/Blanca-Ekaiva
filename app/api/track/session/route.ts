import { prisma } from "@/lib/prisma";
import { deriveSource, geoFromHeaders, parseUA } from "@/lib/track/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b?.sessionId || !b?.visitorId) {
      return Response.json({ ok: false }, { status: 200 });
    }

    const meta = parseUA(req.headers.get("user-agent") || "");
    const geo = geoFromHeaders(req.headers);
    const src = deriveSource(b.referrer || "", {
      source: b.utmSource,
      medium: b.utmMedium,
      campaign: b.utmCampaign,
    });

    await prisma.visitor.upsert({
      where: { visitorId: b.visitorId },
      create: {
        visitorId: b.visitorId,
        isReturning: Boolean(b.returning),
        sessionCount: 1,
      },
      update: {
        lastSeenAt: new Date(),
        isReturning: Boolean(b.returning),
        sessionCount: { increment: 1 },
      },
    });

    await prisma.session.upsert({
      where: { sessionId: b.sessionId },
      create: {
        sessionId: b.sessionId,
        visitorId: b.visitorId,
        visitorType: b.returning ? "RETURNING" : "NEW",
        ip: geo.ip || null,
        country: geo.country || null,
        countryCode: geo.countryCode || null,
        city: geo.city || null,
        region: geo.region || null,
        timezone: b.timezone || null,
        language: b.language || null,
        device: meta.device,
        os: meta.os || null,
        osVersion: meta.osVersion || null,
        browser: meta.browser || null,
        browserVersion: meta.browserVersion || null,
        screenW: b.screenW ?? null,
        screenH: b.screenH ?? null,
        viewportW: b.viewportW ?? null,
        viewportH: b.viewportH ?? null,
        referrer: b.referrer || null,
        trafficSource: src.trafficSource,
        trafficMedium: src.trafficMedium,
        campaign: src.campaign,
        utmSource: b.utmSource || null,
        utmMedium: b.utmMedium || null,
        utmCampaign: b.utmCampaign || null,
        utmTerm: b.utmTerm || null,
        utmContent: b.utmContent || null,
        gclid: b.gclid || null,
        fbclid: b.fbclid || null,
        msclkid: b.msclkid || null,
        placement: b.placement || null,
        metaCampaignId: b.metaCampaignId || null,
        metaAdsetId: b.metaAdsetId || null,
        metaAdId: b.metaAdId || null,
        // Store the raw params only when there are some — never a bare `{}`.
        rawParams:
          b.rawParams && Object.keys(b.rawParams).length
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (b.rawParams as any)
            : undefined,
        landingPage: b.landingPage || "/",
        currentPage: b.landingPage || "/",
      },
      update: { lastActiveAt: new Date(), currentPage: b.landingPage || "/" },
    });

    return Response.json({ ok: true });
  } catch {
    // Best-effort: never surface tracking errors to the visitor.
    return Response.json({ ok: false }, { status: 200 });
  }
}
