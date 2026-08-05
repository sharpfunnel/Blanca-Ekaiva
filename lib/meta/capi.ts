import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ACCESS_TOKEN_PLACEHOLDER,
  buildEventBody,
  collectPayloadWarnings,
  defaultEventSourceUrl,
  eventsEndpoint,
  type CapiEventOptions,
  type CapiIdentity,
} from "@/lib/meta/capi-payload";

/**
 * Meta Conversions API (server-side) sender.
 *
 * Two entry points:
 *   • sendLeadConversionEvent — fired automatically when a lead is created,
 *     deduplicated against the browser Pixel by `event_id` = the Lead row id.
 *   • sendManualConversionEvent — the admin re-send / offline-conversion path.
 *
 * Requires META_PIXEL_ID + META_CAPI_ACCESS_TOKEN on the server. Outside
 * production, when neither is configured, the manual path returns a fake
 * preview success so the UI can be reviewed before Meta credentials exist.
 */

export interface CapiResult {
  ok: boolean;
  eventId?: string;
  fbTraceId?: string;
  eventsReceived?: number;
  /** True when nothing actually reached Meta (dev, no credentials). */
  preview?: boolean;
  error?: string;
}

function credentials() {
  // Empty strings are as good as unset — `""` is falsy, which is the point.
  return {
    pixelId: process.env.META_PIXEL_ID,
    token: process.env.META_CAPI_ACCESS_TOKEN,
  };
}

/** POSTs one event and normalizes Meta's response shape. */
async function postEvent(
  pixelId: string,
  body: Record<string, unknown>,
  eventId: string
): Promise<CapiResult> {
  const res = await fetch(eventsEndpoint(pixelId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: {
    events_received?: number;
    fbtrace_id?: string;
    error?: { message?: string };
  } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    /* non-JSON body — the raw text below is the useful part */
  }

  if (!res.ok || json.error) {
    return {
      ok: false,
      eventId,
      fbTraceId: json.fbtrace_id,
      error: json.error?.message || `HTTP ${res.status}: ${text.slice(0, 500)}`,
    };
  }
  return {
    ok: true,
    eventId,
    fbTraceId: json.fbtrace_id,
    eventsReceived: json.events_received,
  };
}

/* ── Automatic Lead event ─────────────────────────────────────────────────── */

/** Everything the sender needs, read from the Lead row and its session. */
const LEAD_CAPI_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  city: true,
  country: true,
  ip: true,
  userAgent: true,
  fbp: true,
  fbc: true,
  source: true,
  createdAt: true,
  session: {
    select: {
      ip: true,
      city: true,
      region: true,
      country: true,
      countryCode: true,
      fbclid: true,
      startedAt: true,
      landingPage: true,
    },
  },
} as const;

type LeadForCapiRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  ip: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  source: string | null;
  createdAt: Date;
  session: {
    ip: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    countryCode: string | null;
    fbclid: string | null;
    startedAt: Date;
    landingPage: string | null;
  } | null;
};

function identityFromLead(lead: LeadForCapiRow): CapiIdentity {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    ip: lead.ip || lead.session?.ip,
    userAgent: lead.userAgent,
    city: lead.city || lead.session?.city,
    region: lead.session?.region,
    country: lead.country || lead.session?.country,
    countryCode: lead.session?.countryCode,
    fbp: lead.fbp,
    fbc: lead.fbc,
    fbclid: lead.session?.fbclid,
    // The real click time was never captured; the session start is the closest
    // honest substitute for the `fb.1.<click_ms>.<fbclid>` timestamp segment.
    fbclidAt: lead.session?.startedAt ?? lead.createdAt,
    externalId: lead.id,
  };
}

/**
 * Server half of the Lead conversion. Call fire-and-forget from the lead route
 * inside `after()` — a Meta outage must never cost the business a lead, so this
 * function resolves rather than throws, and records its own outcome on the row.
 */
export async function sendLeadConversionEvent(leadId: string): Promise<CapiResult> {
  const { pixelId, token } = credentials();
  if (!pixelId) return { ok: false, error: "META_PIXEL_ID is not configured." };

  try {
    const lead = (await prisma.lead.findUnique({
      where: { id: leadId },
      select: LEAD_CAPI_SELECT,
    })) as LeadForCapiRow | null;
    if (!lead) return { ok: false, error: "Lead not found." };

    if (!token) {
      const error = "META_CAPI_ACCESS_TOKEN is not configured.";
      await recordFailure(leadId, error);
      return { ok: false, error };
    }

    const options: CapiEventOptions = {
      eventName: "Lead",
      // The dedup key: the browser Pixel sends this same value as `eventID`.
      eventId: lead.id,
      eventTime: lead.createdAt,
      value: 0,
      eventSourceUrl: defaultEventSourceUrl(lead.session?.landingPage),
      leadSource: lead.source,
    };

    const body = buildEventBody(identityFromLead(lead), options, token);
    const result = await postEvent(pixelId, body, lead.id);

    if (result.ok) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          metaCapiSentAt: new Date(),
          metaCapiEventId: lead.id,
          metaCapiError: null,
        },
      });
    } else {
      await recordFailure(leadId, result.error ?? "Unknown error");
    }
    return result;
  } catch (e) {
    const message = (e as Error).message;
    await recordFailure(leadId, message);
    return { ok: false, error: message };
  }
}

/** Best-effort error write — a failure to record must not throw either. */
async function recordFailure(leadId: string, error: string) {
  try {
    await prisma.lead.update({
      where: { id: leadId },
      data: { metaCapiError: error.slice(0, 500) },
    });
  } catch {
    /* the row may have been deleted; nothing more we can do */
  }
}

/* ── Manual / offline conversion (admin) ──────────────────────────────────── */

export interface ManualCapiOptions {
  /** One of CAPI_EVENT_TYPES values, or a free-text name for "Custom". */
  eventName: string;
  value?: number | null;
  currency?: string;
  /** Used as the CAPI `event_id`; falls back to the lead id so repeat sends of
   *  the same event collapse into one conversion instead of double-counting. */
  orderId?: string;
}

/**
 * Resolves the identity and event options for a manual send.
 *
 * `event_time` is **now**, not the row's creation time: the operator is
 * recording a conversion that just happened, and most rows worth converting by
 * hand are older than Meta's 7-day window.
 */
async function manualContext(leadId: string, options: ManualCapiOptions) {
  const lead = (await prisma.lead.findUnique({
    where: { id: leadId },
    select: LEAD_CAPI_SELECT,
  })) as LeadForCapiRow | null;
  if (!lead) return null;

  const identity = identityFromLead(lead);
  const event: CapiEventOptions = {
    eventName: options.eventName,
    eventId: options.orderId?.trim() || lead.id,
    eventTime: new Date(),
    value:
      typeof options.value === "number" && Number.isFinite(options.value)
        ? options.value
        : null,
    currency: options.currency,
    eventSourceUrl: defaultEventSourceUrl(lead.session?.landingPage),
    leadSource: lead.source,
  };
  return { lead, identity, event };
}

export interface ManualCapiPreview {
  payload: Record<string, unknown>;
  warnings: string[];
  eventId: string;
}

/**
 * The exact JSON that `sendManualConversionEvent` will POST, with the token
 * replaced by a placeholder. Same builder as the live send — the preview cannot
 * drift away from what is actually sent.
 */
export async function previewManualConversionEvent(
  leadId: string,
  options: ManualCapiOptions
): Promise<ManualCapiPreview | null> {
  const ctx = await manualContext(leadId, options);
  if (!ctx) return null;
  return {
    payload: buildEventBody(ctx.identity, ctx.event, ACCESS_TOKEN_PLACEHOLDER),
    warnings: collectPayloadWarnings(ctx.identity, ctx.event),
    eventId: ctx.event.eventId,
  };
}

export async function sendManualConversionEvent(
  leadId: string,
  options: ManualCapiOptions
): Promise<CapiResult> {
  const { pixelId, token } = credentials();

  const ctx = await manualContext(leadId, options);
  if (!ctx) return { ok: false, error: "Lead not found." };
  const eventId = ctx.event.eventId;

  // Dev preview: let the UI be reviewed before real credentials exist.
  if (!pixelId || !token) {
    if (process.env.NODE_ENV !== "production") {
      return {
        ok: true,
        preview: true,
        eventId,
        fbTraceId: `evt_preview_${eventId.slice(-8)}`,
      };
    }
    return {
      ok: false,
      eventId,
      error:
        "META_PIXEL_ID and META_CAPI_ACCESS_TOKEN must be configured on the server.",
    };
  }

  try {
    const body = buildEventBody(ctx.identity, ctx.event, token);
    return await postEvent(pixelId, body, eventId);
  } catch (e) {
    return { ok: false, eventId, error: (e as Error).message };
  }
}
