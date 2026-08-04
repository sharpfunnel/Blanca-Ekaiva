import { isAdmin } from "@/lib/admin/server/auth";
import { prisma } from "@/lib/prisma";
import {
  sendManualConversionEvent,
  type ManualCapiOptions,
} from "@/lib/meta/capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { leadId?: string } & ManualCapiOptions;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!body.leadId || !body.eventName) {
    return Response.json(
      { ok: false, error: "leadId and eventName are required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: body.leadId },
    include: { session: true },
  });
  if (!lead) {
    return Response.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const result = await sendManualConversionEvent(
    {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      ip: lead.ip || lead.session?.ip,
      city: lead.city || lead.session?.city,
      country: lead.country || lead.session?.country,
      countryCode: lead.session?.countryCode,
    },
    {
      eventName: body.eventName,
      value: body.value,
      currency: body.currency,
      orderId: body.orderId,
      testEventCode: body.testEventCode,
    }
  );

  // Preview sends never touch the real status columns.
  if (!result.preview) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: result.ok
        ? {
            metaCapiSentAt: new Date(),
            metaCapiEventId: result.eventId ?? null,
            metaCapiError: null,
            activities: {
              create: {
                type: "capi_sent",
                detail: `Meta CAPI: ${body.eventName} sent (${result.eventId})`,
              },
            },
          }
        : { metaCapiError: result.error ?? "Unknown error" },
    });
  }

  return Response.json(result, { status: result.ok ? 200 : 502 });
}
