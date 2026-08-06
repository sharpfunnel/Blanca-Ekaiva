/**
 * Wire types shared by the client tracker and the ingestion route.
 *
 * Kept free of any browser or Prisma import so both sides can use them: the
 * collectors build these, `/api/track/event` validates and stores them.
 */

export type TrackEventType =
  | "PAGEVIEW"
  | "CLICK"
  | "RAGE_CLICK"
  | "DEAD_CLICK"
  | "CTA_VIEW"
  | "CTA_HOVER"
  | "CTA_CLICK"
  | "ANCHOR_CLICK"
  | "PHONE_CLICK"
  | "WHATSAPP_CLICK"
  | "EMAIL_CLICK"
  | "DOWNLOAD_BROCHURE"
  | "BOOK_SITE_VISIT"
  | "FORM_OPEN"
  | "FORM_CLOSE"
  | "FORM_START"
  | "FORM_SUBMIT"
  | "FORM_ABANDON"
  | "FIELD_FOCUS"
  | "FIELD_COMPLETE"
  | "VALIDATION_ERROR"
  | "SECTION_VIEW"
  | "SCROLL"
  | "VIDEO_PLAY"
  | "IMAGE_CLICK"
  | "OUTBOUND_LINK"
  | "HOVER";

export interface TrackEvent {
  type: TrackEventType;
  path: string;
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
  /** From `data-cta-id` — a stable key that survives a redesign. */
  ctaId?: string;
  /** From `data-form-id`. */
  formId?: string;
  /** Field `name` (never its value — nothing a visitor types is ever sent). */
  fieldName?: string;
  meta?: Record<string, unknown>;
  ts: number;
}

export type VitalName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
export type VitalRating = "GOOD" | "NEEDS_IMPROVEMENT" | "POOR";

export interface TrackVital {
  name: VitalName;
  value: number;
  rating: VitalRating;
  path: string;
}

export type TrackErrorKind =
  | "JS_ERROR"
  | "UNHANDLED_REJECTION"
  | "RESOURCE_ERROR";

export interface TrackError {
  kind: TrackErrorKind;
  message: string;
  source?: string;
  lineNo?: number;
  colNo?: number;
  stack?: string;
  path: string;
}

/**
 * What every collector is handed. One shared batch, three typed lanes — the
 * queue posts all of them in a single request rather than one endpoint per
 * event kind.
 */
export interface TrackerContext {
  track(event: Omit<TrackEvent, "ts" | "path"> & { path?: string }): void;
  vital(v: TrackVital): void;
  error(e: TrackError): void;
  /** Force an immediate send — for events that often precede a navigation. */
  flush(beacon?: boolean): void;
  /** Registers a callback to run on pagehide, for end-of-visit accounting. */
  onUnload(fn: () => void): void;
}
