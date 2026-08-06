import type { TrackerContext, VitalName, VitalRating } from "@/lib/track/types";

/**
 * Core Web Vitals via the `web-vitals` library, which is the reference
 * implementation of Google's own thresholds — including the parts that are
 * genuinely hard to get right (CLS session windows, INP interaction attribution).
 *
 * Each metric reports once, at its final value, when the page is backgrounded
 * or unloaded. Loaded dynamically so it costs the landing page nothing on the
 * critical path.
 */

const RATING: Record<string, VitalRating> = {
  good: "GOOD",
  "needs-improvement": "NEEDS_IMPROVEMENT",
  poor: "POOR",
};

export function initVitalsCollector(ctx: TrackerContext) {
  void import("web-vitals")
    .then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
      const report = (metric: {
        name: string;
        value: number;
        rating: string;
      }) => {
        ctx.vital({
          name: metric.name as VitalName,
          // CLS is unitless and small; everything else is milliseconds. Round
          // to something a dashboard can display without lying about precision.
          value:
            metric.name === "CLS"
              ? +metric.value.toFixed(4)
              : Math.round(metric.value),
          rating: RATING[metric.rating] ?? "NEEDS_IMPROVEMENT",
          path: location.pathname,
        });
      };
      onLCP(report);
      onINP(report);
      onCLS(report);
      onFCP(report);
      onTTFB(report);
    })
    .catch(() => {
      /* vitals are optional — never let them break capture */
    });
}
