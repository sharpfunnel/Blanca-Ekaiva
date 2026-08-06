import type { TrackerContext } from "@/lib/track/types";

/**
 * CTA lifecycle, keyed by `data-cta-id`.
 *
 * The whole convention: tag any button or link `data-cta-id="hero-call"` and it
 * is tracked — viewed, hovered, clicked — with no other code change. Tracking a
 * new CTA is a markup edit, not a deploy of new JavaScript.
 *
 * Clicks are NOT handled here; the main click listener in tracker.ts already
 * fires for every click and reads `data-cta-id` off the target, so handling
 * them here too would double-count.
 */
export function initCtaCollector(ctx: TrackerContext) {
  const viewed = new Set<string>();
  const hovered = new Set<string>();

  const idOf = (el: Element) => el.getAttribute("data-cta-id") || "";
  const labelOf = (el: Element) =>
    (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 80);

  let observer: IntersectionObserver | null = null;
  try {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = idOf(entry.target);
          // Once per page: a CTA scrolled past three times is still one view.
          if (!id || viewed.has(id)) continue;
          viewed.add(id);
          ctx.track({ type: "CTA_VIEW", ctaId: id, text: labelOf(entry.target) });
          observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );
  } catch {
    return; // no IntersectionObserver → skip CTA tracking entirely
  }

  const onEnter = (event: Event) => {
    const el = event.currentTarget as Element;
    const id = idOf(el);
    if (!id || hovered.has(id)) return;
    hovered.add(id);
    ctx.track({ type: "CTA_HOVER", ctaId: id, text: labelOf(el) });
  };

  const wired = new WeakSet<Element>();
  function attach(root: ParentNode) {
    root.querySelectorAll?.("[data-cta-id]").forEach((el) => {
      if (wired.has(el)) return;
      wired.add(el);
      observer?.observe(el);
      el.addEventListener("mouseenter", onEnter, { passive: true });
    });
  }

  attach(document);

  // Client-side navigation and conditionally-rendered sections mount CTAs long
  // after this runs, so watch for them rather than only scanning once.
  try {
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.hasAttribute?.("data-cta-id") && !wired.has(el)) {
            wired.add(el);
            observer?.observe(el);
            el.addEventListener("mouseenter", onEnter, { passive: true });
          }
          attach(el);
        });
      }
    }).observe(document.body, { childList: true, subtree: true });
  } catch {
    /* no MutationObserver → CTAs present at load are still tracked */
  }
}
