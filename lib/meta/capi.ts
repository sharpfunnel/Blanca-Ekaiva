import crypto from "node:crypto";

/**
 * Meta Conversions API (server-side) sender.
 *
 * Sends a conversion event for a lead directly to Meta's Graph API. Personal
 * data (email, phone, name, city, country) is SHA-256 hashed per Meta's spec
 * before it leaves the server. IP and user-agent are sent unhashed.
 *
 * Requires META_PIXEL_ID + META_CAPI_ACCESS_TOKEN on the server. When neither
 * is configured and NODE_ENV !== "production", it returns a fake preview
 * success so the UI can be reviewed before Meta credentials exist.
 */

const GRAPH_VERSION = "v21.0";

export const CAPI_EVENT_TYPES = [
  { value: "Lead", label: "Lead" },
  { value: "Purchase", label: "Purchase" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "CompleteRegistration", label: "Registration" },
  { value: "StartTrial", label: "Start Trial" },
  { value: "Custom", label: "Custom" },
] as const;

export interface ManualCapiOptions {
  /** One of CAPI_EVENT_TYPES values, or a free-text name for "Custom". */
  eventName: string;
  value?: number | null;
  currency?: string;
  /** Used as the CAPI `event_id` for dedup against a client-side Pixel. */
  orderId?: string;
  testEventCode?: string;
}

export interface ManualCapiResult {
  ok: boolean;
  eventId?: string;
  fbTraceId?: string;
  eventsReceived?: number;
  preview?: boolean;
  error?: string;
}

export interface LeadForCapi {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  ip?: string | null;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
}

const sha256 = (v: string) =>
  crypto.createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

function buildUserData(lead: LeadForCapi) {
  const ud: Record<string, unknown> = {};
  if (lead.email) ud.em = [sha256(lead.email)];
  const phone = (lead.phone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (phone) ud.ph = [sha256(phone)];
  if (lead.name) {
    const parts = lead.name.trim().split(/\s+/);
    if (parts[0]) ud.fn = [sha256(parts[0])];
    if (parts.length > 1) ud.ln = [sha256(parts.slice(1).join(" "))];
  }
  if (lead.city) ud.ct = [sha256(lead.city.replace(/\s+/g, ""))];
  const cc = lead.countryCode || lead.country;
  if (cc) ud.country = [sha256(cc.slice(0, 2))];
  if (lead.ip) ud.client_ip_address = lead.ip;
  ud.client_user_agent = "BlancaAdmin/1.0 (+conversions-api)";
  return ud;
}

export async function sendManualConversionEvent(
  lead: LeadForCapi,
  options: ManualCapiOptions
): Promise<ManualCapiResult> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const eventId =
    options.orderId?.trim() ||
    `blanca_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // Dev preview: let the UI be reviewed before real credentials exist.
  if ((!pixelId || !token) && process.env.NODE_ENV !== "production") {
    return {
      ok: true,
      preview: true,
      eventId,
      fbTraceId: `evt_preview_${Date.now().toString(36)}`,
    };
  }
  if (!pixelId || !token) {
    return {
      ok: false,
      error:
        "META_PIXEL_ID and META_CAPI_ACCESS_TOKEN must be configured on the server.",
      eventId,
    };
  }

  const custom_data: Record<string, unknown> = {};
  if (typeof options.value === "number" && !Number.isNaN(options.value))
    custom_data.value = options.value;
  if (options.currency) custom_data.currency = options.currency;

  const payload = {
    data: [
      {
        event_name: options.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
        user_data: buildUserData(lead),
        custom_data,
      },
    ],
    ...(options.testEventCode ? { test_event_code: options.testEventCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = (await res.json()) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string };
    };
    if (!res.ok || json.error) {
      return {
        ok: false,
        eventId,
        error: json.error?.message || `Graph API returned ${res.status}`,
      };
    }
    return {
      ok: true,
      eventId,
      fbTraceId: json.fbtrace_id,
      eventsReceived: json.events_received,
    };
  } catch (e) {
    return { ok: false, eventId, error: (e as Error).message };
  }
}
