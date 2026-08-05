import "server-only";

import crypto from "node:crypto";

import {
  DEFAULT_COUNTRY_DIAL_CODE,
  DEFAULT_CURRENCY,
} from "@/lib/meta/constants";

/**
 * Meta Conversions API payload construction.
 *
 * Deliberately separate from the network call in lib/meta/capi.ts: the admin
 * modal previews the exact JSON that will be sent, and a preview built by
 * different code is a preview that lies. One builder, two callers.
 *
 * `server-only` — this module hashes PII and formats the access token into the
 * body; it must never be reachable from a client bundle.
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

/** Placeholder substituted for the real token in previews. */
export const ACCESS_TOKEN_PLACEHOLDER = "<ACCESS_TOKEN>";

/** Meta rejects events whose event_time is older than this. */
const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function eventsEndpoint(pixelId: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`;
}

/** Meta's normalization for hashed fields: trim + lowercase, then SHA-256 hex. */
export function sha256(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

/** Names and locality fields additionally drop all internal whitespace. */
function sha256Compact(value: string) {
  return sha256(value.replace(/\s+/g, ""));
}

/**
 * Digits only, **including the country code** — a bare 10-digit Indian mobile
 * hashes to something Meta has never seen, which is the single most common
 * cause of low match quality.
 */
export function normalizePhone(raw: string, dial = DEFAULT_COUNTRY_DIAL_CODE) {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  // Already carries a country code (the default one, or some other).
  if (digits.length > 10) return digits;
  return dial + digits;
}

/** True when the operator's raw input had no country code and we assumed one. */
export function phoneCountryCodeAssumed(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length > 0 && digits.length <= 10;
}

/** Everything the server knows about the person who converted. */
export interface CapiIdentity {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  city?: string | null;
  region?: string | null;
  zip?: string | null;
  country?: string | null;
  countryCode?: string | null;
  /** `_fbp` cookie, verbatim. */
  fbp?: string | null;
  /** `_fbc` cookie, verbatim — preferred over reconstructing from fbclid. */
  fbc?: string | null;
  /** Click id from the landing URL, used only when the `_fbc` cookie is absent. */
  fbclid?: string | null;
  /** Approximates the click time when reconstructing `fbc`. */
  fbclidAt?: Date | null;
  /** Stable internal id (the Lead row id) — improves matching across events. */
  externalId?: string | null;
}

export interface CapiEventOptions {
  /** Case-sensitive standard name (`Lead`, not `lead`) or a custom name. */
  eventName: string;
  /** The dedup key. Must equal the browser event's `eventID`. */
  eventId: string;
  /** Converted to unix seconds. */
  eventTime: Date;
  value?: number | null;
  currency?: string | null;
  eventSourceUrl?: string | null;
  leadSource?: string | null;
}

export function buildUserData(identity: CapiIdentity) {
  const ud: Record<string, unknown> = {};

  // Hashed identifiers — each a one-element array, per Meta's spec.
  if (identity.email) ud.em = [sha256(identity.email)];

  const phone = identity.phone ? normalizePhone(identity.phone) : "";
  if (phone) ud.ph = [sha256(phone)];

  if (identity.name) {
    const parts = identity.name.trim().split(/\s+/);
    if (parts[0]) ud.fn = [sha256Compact(parts[0])];
    if (parts.length > 1) ud.ln = [sha256Compact(parts.slice(1).join(""))];
  }
  if (identity.city) ud.ct = [sha256Compact(identity.city)];
  if (identity.region) ud.st = [sha256Compact(identity.region)];
  if (identity.zip) ud.zp = [sha256Compact(identity.zip)];

  // Meta wants the ISO-3166 two-letter code, lowercased then hashed.
  const cc = identity.countryCode || identity.country;
  if (cc) ud.country = [sha256Compact(cc.slice(0, 2))];

  if (identity.externalId) ud.external_id = [sha256(identity.externalId)];

  // Unhashed identifiers.
  if (identity.ip) ud.client_ip_address = identity.ip;
  if (identity.userAgent) ud.client_user_agent = identity.userAgent;

  const fbc = resolveFbc(identity);
  if (fbc) ud.fbc = fbc;
  if (identity.fbp) ud.fbp = identity.fbp;

  return ud;
}

/**
 * The `_fbc` cookie when the browser had one, otherwise rebuilt from the click
 * id. The real click timestamp was never captured, so the row's creation time
 * stands in — an approximation Meta tolerates, since only the fbclid segment is
 * matched.
 */
function resolveFbc(identity: CapiIdentity) {
  if (identity.fbc) return identity.fbc;
  if (!identity.fbclid) return "";
  const clickMs = (identity.fbclidAt ?? new Date()).getTime();
  return `fb.1.${clickMs}.${identity.fbclid}`;
}

/**
 * The complete request body. `accessToken` travels in the body rather than the
 * query string so it never lands in an access log; pass
 * ACCESS_TOKEN_PLACEHOLDER when building a preview for the browser.
 */
export function buildEventBody(
  identity: CapiIdentity,
  options: CapiEventOptions,
  accessToken: string
) {
  const customData: Record<string, unknown> = {};
  // value and currency travel together or not at all.
  if (typeof options.value === "number" && Number.isFinite(options.value)) {
    customData.value = options.value;
    customData.currency = options.currency || DEFAULT_CURRENCY;
  }
  if (options.leadSource) customData.lead_source = options.leadSource;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: options.eventName,
        event_time: Math.floor(options.eventTime.getTime() / 1000),
        action_source: "website",
        event_id: options.eventId,
        ...(options.eventSourceUrl
          ? { event_source_url: options.eventSourceUrl }
          : {}),
        user_data: buildUserData(identity),
        custom_data: customData,
      },
    ],
    access_token: accessToken,
  };

  // Set ONLY while testing. Left set in production, every real conversion lands
  // in the Test events panel and counts as zero.
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }
  return body;
}

/** The default `event_source_url` — the landing page the lead came from. */
export function defaultEventSourceUrl(path?: string | null) {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return null;
  if (!path) return base;
  try {
    return new URL(path, base).toString();
  } catch {
    return base;
  }
}

/**
 * Problems worth showing an operator before they send. None of these block the
 * request — Meta accepts most of them and quietly matches nothing.
 */
export function collectPayloadWarnings(
  identity: CapiIdentity,
  options: CapiEventOptions
) {
  const warnings: string[] = [];
  const ud = buildUserData(identity);

  if (Object.keys(ud).length === 0)
    warnings.push("user_data is empty — Meta will reject this event.");
  if (!options.eventId.trim())
    warnings.push("event_id is blank — this event cannot be deduplicated.");
  if (identity.phone && phoneCountryCodeAssumed(identity.phone))
    warnings.push(
      `Phone had no country code; +${DEFAULT_COUNTRY_DIAL_CODE} was assumed before hashing.`
    );
  if (!ud.fbc && !ud.fbp)
    warnings.push(
      "No _fbc or _fbp — match quality will be poor for this event."
    );
  if (Date.now() - options.eventTime.getTime() > MAX_EVENT_AGE_MS)
    warnings.push(
      "event_time is more than 7 days old — Meta will reject this event."
    );
  if (
    options.eventName === "Purchase" &&
    !(typeof options.value === "number" && Number.isFinite(options.value))
  )
    warnings.push("Purchase requires a value and currency.");

  return warnings;
}
