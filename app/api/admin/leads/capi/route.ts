import { isAdmin } from "@/lib/admin/server/auth";
import { prisma } from "@/lib/prisma";
import {
  previewManualConversionEvent,
  sendManualConversionEvent,
  type ManualCapiOptions,
} from "@/lib/meta/capi";
import {
  CAPI_EVENT_TYPES,
  CUSTOM_EVENT_NAME_PATTERN,
} from "@/lib/meta/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manual / offline Meta conversion sends from the leads table.
 *
 * The client supplies a lead id and the operator's choices — nothing else.
 * Email, phone, IP, user-agent, `_fbp`/`_fbc` and location are re-read from the
 * database, so the browser can never dictate whose data reaches Meta.
 */

interface CapiRequestBody extends ManualCapiOptions {
  leadId?: string;
  /** "preview" returns the exact JSON that "send" would POST. */
  action?: "preview" | "send";
}

const STANDARD_NAMES = new Set(
  CAPI_EVENT_TYPES.map((t) => t.value).filter((v) => v !== "Custom")
);

function validateEventName(name: string) {
  if (STANDARD_NAMES.has(name as never)) return null;
  if (!CUSTOM_EVENT_NAME_PATTERN.test(name))
    return "Custom event names may only contain letters, numbers and underscores (max 50).";
  return null;
}

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: CapiRequestBody;
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

  const nameError = validateEventName(body.eventName);
  if (nameError)
    return Response.json({ ok: false, error: nameError }, { status: 400 });

  const options: ManualCapiOptions = {
    eventName: body.eventName,
    value: body.value,
    currency: body.currency,
    orderId: body.orderId,
  };

  if (body.action === "preview") {
    const preview = await previewManualConversionEvent(body.leadId, options);
    if (!preview)
      return Response.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    return Response.json({ ok: true, ...preview });
  }

  const result = await sendManualConversionEvent(body.leadId, options);

  // Preview sends never touch the real status columns.
  if (!result.preview) {
    try {
      await prisma.lead.update({
        where: { id: body.leadId },
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
          : { metaCapiError: (result.error ?? "Unknown error").slice(0, 500) },
      });
    } catch {
      /* the lead may have been deleted mid-send; the result still stands */
    }
  }

  return Response.json(result, { status: result.ok ? 200 : 502 });
}
