"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { contact, telHref, whatsappHref } from "@/lib/site";

/**
 * Floating conversion actions required by the brief:
 * WhatsApp bottom-right on every breakpoint, Call bottom-left on mobile.
 *
 * On phones the two are rendered as one full-width bottom bar (Call left,
 * WhatsApp right) rather than two free-floating pills: a bar gives both actions
 * a full-size tap target, sits clear of the home indicator via the safe-area
 * inset, and never overlaps body copy the way corner pills do at 390px.
 * From `sm` up there is room to float, so the WhatsApp pill returns.
 *
 * Both fade in once the user has scrolled past the hero so they never cover
 * the hero's own call-to-action buttons.
 */
export function StickyActions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transition =
    "transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)]";

  const hiddenBar = visible
    ? "translate-y-0 opacity-100"
    : "pointer-events-none translate-y-full opacity-0";

  const hiddenPill = visible
    ? "translate-y-0 opacity-100"
    : "pointer-events-none translate-y-4 opacity-0";

  return (
    <>
      {/* ── Phones: one bottom action bar ──────────────────────────────── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/95 backdrop-blur-xl sm:hidden ${transition} ${hiddenBar}`}
      >
        {/* pb clears the iOS home indicator without leaving a gap on Android */}
        <div className="flex gap-2.5 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <a
            href={telHref}
            data-cta-id="sticky-call"
            aria-label={`Call ${contact.name} on ${contact.phoneDisplay}`}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/25 text-base font-medium text-white active:scale-[0.98]"
          >
            <Icon name="phone" className="size-5" />
            Call
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-cta-id="sticky-whatsapp"
            aria-label="Chat with Rahul Thakur on WhatsApp about Blanca Ekaiva"
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-medium text-white active:scale-[0.98]"
          >
            <Icon name="whatsapp" className="size-5" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* ── Tablet and up: floating WhatsApp pill, brand green with a pulse ── */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        data-cta-id="floating-whatsapp"
        aria-label="Chat with Rahul Thakur on WhatsApp about Blanca Ekaiva"
        className={`fixed bottom-7 right-7 z-50 hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-base font-medium text-white shadow-lg hover:brightness-105 sm:flex ${transition} ${hiddenPill}`}
        style={{ animation: visible ? "pulse-ring 2.6s infinite" : undefined }}
      >
        <Icon name="whatsapp" className="size-6" />
        WhatsApp
      </a>
    </>
  );
}
