"use client";

import { useEffect } from "react";

/**
 * Mounts the visitor tracking SDK on the landing page only. Loaded dynamically
 * so rrweb never ships in the initial landing-page bundle.
 */
export function Tracker() {
  useEffect(() => {
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
