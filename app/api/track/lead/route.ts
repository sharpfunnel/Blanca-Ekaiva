import { after } from "next/server";

import { sendLeadConversionEvent } from "@/lib/meta/capi";
import { prisma } from "@/lib/prisma";
import { geoFromHeaders, parseUA } from "@/lib/track/server";

export const runtime = "nodejs";

/** One cookie out of a raw Cookie header; null when absent. */
function readCookie(header: string, name: string) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).slice(0, 400);
  } catch {
    return match[1].slice(0, 400);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b?.name || !b?.phone) {
      return Response.json({ ok: false, error: "name and phone required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const meta = parseUA(userAgent);
    const geo = geoFromHeaders(req.headers);
    const cookies = req.headers.get("cookie") || "";
    const fbpCookie = readCookie(cookies, "_fbp");
    const fbcCookie = readCookie(cookies, "_fbc");

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
        userAgent: userAgent || null,
        // The Pixel writes _fbp/_fbc as first-party cookies on this domain, so
        // they arrive on this same-origin POST — read them here rather than
        // letting the browser hand us identifiers it could have made up.
        fbp: fbpCookie,
        fbc: fbcCookie,
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

    // Server half of the Meta conversion, after the response is sent. It uses
    // the lead id as `event_id`, which the browser Pixel also sends as
    // `eventID`, so Meta counts one conversion instead of two. Never awaited
    // and it never throws — a Meta outage must not cost the business a lead.
    after(() => sendLeadConversionEvent(lead.id));

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
