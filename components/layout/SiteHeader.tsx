"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Wordmark } from "./Wordmark";
import { contact, telHref } from "@/lib/site";

/**
 * Sticky top bar.
 *
 * The brief specifies no navigation menu — the page has a single goal — so this
 * carries identity and the two conversion actions only. It reproduces the
 * template's header behaviour: transparent over the hero, then a solid blurred
 * bar once the user scrolls past it.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)] ${
        scrolled
          ? "border-b border-white/10 bg-ink/90 py-2.5 backdrop-blur-xl sm:py-3"
          : "border-b border-transparent bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#main" aria-label="Blanca Ekaiva — back to top">
          <Wordmark />
        </a>

        <div className="flex items-center gap-3">
          {/* Phone is the highest-intent action, so it stays visible on tablet+ */}
          <a
            href={telHref}
            className="hidden items-center gap-2 text-base font-medium text-white transition-colors duration-300 hover:text-gold sm:inline-flex"
          >
            <Icon name="phone" className="size-[18px]" />
            {contact.phoneDisplay}
          </a>

          <Button href="#enquire" size="md" className="hidden md:inline-flex">
            Get Price &amp; Floor Plan
          </Button>

          {/* Compact icon-only call button below the sm breakpoint */}
          <a
            href={telHref}
            aria-label={`Call ${contact.name} on ${contact.phoneDisplay}`}
            className="inline-flex size-11 items-center justify-center rounded-full bg-gold text-ink transition-transform duration-300 hover:scale-105 sm:hidden"
          >
            <Icon name="phone" className="size-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
