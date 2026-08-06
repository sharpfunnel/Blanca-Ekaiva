import type { TrackerContext } from "@/lib/track/types";

/**
 * Frustration signals and the hover heatmap.
 *
 * • rage-click — 3+ clicks on the same element within 1s
 * • dead-click — a click on a non-interactive element that changes nothing in
 *   the DOM within 600ms. A MutationObserver decides, rather than a guess at
 *   which elements "should" respond.
 * • hover — a throttled mousemove sampler, the only source for the hover
 *   heatmap. Without it the admin's hover panel has nothing to show.
 */

const RAGE_WINDOW_MS = 1000;
const RAGE_THRESHOLD = 3;
const DEAD_CLICK_WAIT_MS = 600;
const HOVER_SAMPLE_MS = 1500;

const INTERACTIVE =
  "a,button,input,select,textarea,label,summary,[role=button],[role=link],[role=tab],[contenteditable]";

export function initMouseCollector(
  ctx: TrackerContext,
  helpers: {
    selectorFor: (el: Element | null) => string;
    docSize: () => { w: number; h: number };
  }
) {
  const { selectorFor, docSize } = helpers;

  /* ── rage clicks ───────────────────────────────────────────────────────── */
  let lastTarget: Element | null = null;
  let streak = 0;
  let streakStartedAt = 0;
  let rageReported = false;

  /* ── dead clicks ───────────────────────────────────────────────────────── */
  // One long-lived observer, armed only for the window after a candidate
  // click — cheaper than constructing one per click.
  let mutatedSinceClick = false;
  try {
    new MutationObserver(() => {
      mutatedSinceClick = true;
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  } catch {
    /* without a MutationObserver we simply never claim a click was dead */
  }

  addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null;
      if (!target) return;
      const now = Date.now();

      // Rage: same element, repeatedly, fast.
      if (target === lastTarget && now - streakStartedAt < RAGE_WINDOW_MS) {
        streak += 1;
      } else {
        lastTarget = target;
        streak = 1;
        streakStartedAt = now;
        rageReported = false;
      }
      if (streak >= RAGE_THRESHOLD && !rageReported) {
        rageReported = true;
        const { w, h } = docSize();
        ctx.track({
          type: "RAGE_CLICK",
          selector: selectorFor(target),
          text: (target.textContent || "").trim().slice(0, 80),
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY,
          relX: +((event as MouseEvent).pageX / w).toFixed(4),
          relY: +((event as MouseEvent).pageY / h).toFixed(4),
          meta: { clicks: streak },
        });
        ctx.flush();
      }

      // Dead: only ever a candidate if the visitor hit something inert.
      if (target.closest(INTERACTIVE)) return;
      mutatedSinceClick = false;
      const pageX = (event as MouseEvent).pageX;
      const pageY = (event as MouseEvent).pageY;
      setTimeout(() => {
        if (mutatedSinceClick) return;
        const { w, h } = docSize();
        ctx.track({
          type: "DEAD_CLICK",
          selector: selectorFor(target),
          text: (target.textContent || "").trim().slice(0, 80),
          relX: +(pageX / w).toFixed(4),
          relY: +(pageY / h).toFixed(4),
        });
      }, DEAD_CLICK_WAIT_MS);
    },
    { capture: true, passive: true }
  );

  /* ── hover sampler ─────────────────────────────────────────────────────── */
  let lastSample = 0;
  addEventListener(
    "mousemove",
    (event) => {
      const now = Date.now();
      if (now - lastSample < HOVER_SAMPLE_MS) return;
      lastSample = now;
      const target = event.target as Element | null;
      if (!target) return;
      const { w, h } = docSize();
      ctx.track({
        type: "HOVER",
        selector: selectorFor(target.closest("a,button,section,[id]") || target),
        text: (target.textContent || "").trim().slice(0, 60),
        relX: +(event.pageX / w).toFixed(4),
        relY: +(event.pageY / h).toFixed(4),
        vpW: innerWidth,
        vpH: innerHeight,
      });
    },
    { passive: true }
  );
}
