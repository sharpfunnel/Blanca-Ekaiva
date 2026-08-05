/**
 * Meta Pixel (browser) helpers.
 *
 * Every call uses `trackSingle`, never `track`. A GTM container is installed on
 * this site (see app/layout.tsx); if it ever initialises a Meta pixel of its
 * own, `fbq("track", …)` would broadcast this site's conversions to *every*
 * initialised pixel — including someone else's dataset. `trackSingle` pins each
 * call to our own pixel id.
 */

declare global {
  interface Window {
    /** Meta Pixel, injected by components/analytics/MetaPixel.tsx. */
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Inlined at BUILD time, not runtime — changing it needs a redeploy, not a
 * restart. An unset var is `undefined` and an unfilled one is `""`; both are
 * falsy, which is exactly what every guard below relies on.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Fired on client-side route changes; the inline snippet fires the first one. */
export function trackPixelPageView() {
  if (!META_PIXEL_ID) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "PageView");
}

/**
 * Browser half of the Lead conversion.
 *
 * `eventId` MUST be the Lead row's database id — the same value the server
 * sender puts in `event_id`. Meta collapses the browser and server events into
 * one conversion only when the two ids match exactly.
 */
export function trackPixelLead(
  eventId: string,
  customData?: Record<string, unknown>
) {
  if (!META_PIXEL_ID) return;
  window.fbq?.(
    "trackSingle",
    META_PIXEL_ID,
    "Lead",
    customData ?? {},
    { eventID: eventId }
  );
}
