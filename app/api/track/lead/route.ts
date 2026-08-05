import { prisma } from "@/lib/prisma";
import { geoFromHeaders, parseUA } from "@/lib/track/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b?.name || !b?.phone) {
      return Response.json({ ok: false, error: "name and phone required" }, { status: 400 });
    }

    const meta = parseUA(req.headers.get("user-agent") || "");
    const geo = geoFromHeaders(req.headers);

    // Pull acquisition context from the visitor's session when we have one.
    const session = b.sessionId
      ? await prisma.session.findUnique({ where: { sessionId: b.sessionId } })
      : null;

    const lead = await prisma.lead.create({
      data: {
        sessionId: session ? b.sessionId : null,
        visitorId: b.visitorId || session?.visitorId || null,
        name: String(b.name).slice(0, 120),
        phone: String(b.phone).slice(0, 40),
        email: b.email ? String(b.email).slice(0, 160) : null,
        interest: b.interest || null,
        budget: b.budget || null,
        message: b.message || null,
        city: geo.city || session?.city || null,
        country: geo.country || session?.country || null,
        source: session?.trafficSource || null,
        campaign: session?.campaign || null,
        utmSource: session?.utmSource || null,
        utmMedium: session?.utmMedium || null,
        utmCampaign: session?.utmCampaign || null,
        device: meta.device,
        browser: meta.browser || null,
        os: meta.os || null,
        ip: geo.ip || session?.ip || null,
        status: "NEW",
        activities: {
          create: { type: "created", detail: "Lead submitted via landing page form" },
        },
      },
    });

    if (session) {
      await prisma.session.update({
        where: { sessionId: b.sessionId },
        data: { formSubmitted: true, isConverted: true, isBounce: false },
      });
    }
    if (b.visitorId || session?.visitorId) {
      await prisma.visitor.update({
        where: { visitorId: (b.visitorId || session?.visitorId) as string },
        data: { leadCount: { increment: 1 } },
      });
    }

    // Return the lead id so the client can redirect to /thank-you?leadId=… and
    // enrich this same row with optional details.
    return Response.json({ ok: true, leadId: lead.id });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}

/** Enriches an existing lead with the optional details added on /thank-you. */
export async function PATCH(req: Request) {
  try {
    const b = await req.json();
    const leadId = b?.leadId ? String(b.leadId) : "";
    if (!leadId) {
      return Response.json({ ok: false, error: "leadId is required" }, { status: 400 });
    }

    const email = b.email ? String(b.email).slice(0, 160) : "";
    const budget = b.budget ? String(b.budget).slice(0, 60) : "";
    const message = b.message ? String(b.message).slice(0, 2000) : "";
    if (!email && !budget && !message) {
      return Response.json({ ok: false, error: "Nothing to update" }, { status: 400 });
    }

    try {
      await prisma.lead.update({
        where: { id: leadId },
        // Only ever write fields that were actually provided.
        data: {
          ...(email ? { email } : {}),
          ...(budget ? { budget } : {}),
          ...(message ? { message } : {}),
          activities: {
            create: { type: "enriched", detail: "Details added on thank-you page" },
          },
        },
      });
    } catch {
      return Response.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
