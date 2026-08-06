import type { TrackerContext } from "@/lib/track/types";

/**
 * Client-side errors: thrown exceptions, unhandled promise rejections, and
 * failed asset loads (a broken hero render is invisible in server logs — the
 * request never reaches us if the URL is simply wrong).
 *
 * Deduplicated per page: one bad image inside a carousel can fire hundreds of
 * times, and a hundred identical rows tell you nothing the first one didn't.
 */

const MAX_PER_PAGE = 20;

export function initErrorCollector(ctx: TrackerContext) {
  const seen = new Set<string>();
  let sent = 0;

  const report = (
    kind: "JS_ERROR" | "UNHANDLED_REJECTION" | "RESOURCE_ERROR",
    message: string,
    extra: { source?: string; lineNo?: number; colNo?: number; stack?: string } = {}
  ) => {
    const key = `${kind}:${message}:${extra.source ?? ""}:${extra.lineNo ?? ""}`;
    if (seen.has(key) || sent >= MAX_PER_PAGE) return;
    seen.add(key);
    sent += 1;
    ctx.error({
      kind,
      message: message.slice(0, 500),
      source: extra.source?.slice(0, 300),
      lineNo: extra.lineNo,
      colNo: extra.colNo,
      stack: extra.stack?.slice(0, 2000),
      path: location.pathname,
    });
  };

  addEventListener("error", (event) => {
    const target = event.target as (Element & { src?: string }) | null;

    // Resource failures arrive as an `error` event on the element itself and
    // never reach window.onerror — they only surface in the capture phase.
    if (target && target !== (window as unknown as Element) && target.tagName) {
      const tag = target.tagName.toLowerCase();
      if (tag === "img" || tag === "script" || tag === "link") {
        const src =
          target.getAttribute("src") || target.getAttribute("href") || "";
        report("RESOURCE_ERROR", `Failed to load <${tag}>`, { source: src });
      }
      return;
    }

    const err = event as ErrorEvent;
    report("JS_ERROR", err.message || "Unknown error", {
      source: err.filename,
      lineNo: err.lineno,
      colNo: err.colno,
      stack: err.error?.stack,
    });
  }, true); // capture — resource errors do not bubble

  addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";
    report("UNHANDLED_REJECTION", message, {
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
