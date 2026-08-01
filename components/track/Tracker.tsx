"use client";

import { useEffect } from "react";

/**
 * On the landing page:
 *  • Normal load → boots the visitor tracking SDK (rrweb + events).
 *  • Loaded as the admin heatmap backdrop (?heatmap=1, or inside an iframe) →
 *    does NOT track; instead forces reveal content visible (via the `heatmap`
 *    class) and reports the page's real height to the parent with postMessage,
 *    so the heatmap can size the iframe correctly even cross-origin.
 */
export function Tracker() {
  useEffect(() => {
    const isHeatmap = (() => {
      try {
        return (
          new URLSearchParams(location.search).get("heatmap") === "1" ||
          window.top !== window.self
        );
      } catch {
        return true; // cross-origin framing → treat as heatmap backdrop
      }
    })();

    if (isHeatmap) {
      document.documentElement.classList.add("heatmap");
      const postHeight = () => {
        try {
          window.parent.postMessage(
            {
              type: "blanca-heatmap-height",
              height: Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
              ),
            },
            "*"
          );
        } catch {
          /* ignore */
        }
      };
      postHeight();
      const timers = [
        setTimeout(postHeight, 400),
        setTimeout(postHeight, 1200),
        setTimeout(postHeight, 2500),
      ];
      window.addEventListener("load", postHeight);
      window.addEventListener("resize", postHeight);
      return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener("load", postHeight);
        window.removeEventListener("resize", postHeight);
      };
    }

    let cancelled = false;
    import("@/lib/track/tracker")
      .then((m) => {
        if (!cancelled) m.initTracker();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
