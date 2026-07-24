import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { amenities, amenityChips } from "@/lib/content";

/**
 * Section 4 — "Crafting the Art of Indulgence".
 *
 * Eight amenity cards over the project renders, followed by an infinite
 * marquee of the supporting amenities. Dark section, mirroring the template's
 * alternating light/dark section rhythm.
 */
export function Amenities() {
  return (
    <section
      id="amenities"
      className="scroll-mt-24 overflow-hidden bg-ink py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label={amenities.label}
          heading="Crafting the Art of *Indulgence*"
          intro={amenities.intro}
          onDark
          align="center"
        />

        {/*
          Eight 4:5 cards stacked full-width is roughly 3,500px of scroll on a
          phone. Below `sm` the grid becomes a snap-scrolling rail instead: the
          negative margin lets it bleed to the screen edge while the matching
          padding keeps the first card aligned with the copy above and leaves
          the last one able to scroll clear.
        */}
        <ul className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible sm:px-0 lg:grid-cols-4">
          {amenities.items.map((item, i) => (
            <li
              key={item.title}
              className="w-[76%] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              {/* Stagger resets every row so cards ripple in diagonally */}
              <Reveal delay={(i % 4) * 90} className="h-full">
                <article className="group relative h-full overflow-hidden rounded-card border border-white/10 transition-colors duration-500 hover:border-gold/45">
                  <div className="relative aspect-4/5">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 76vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.44,0,0.16,1)] group-hover:scale-105"
                    />

                    {/* Scrim keeps the caption legible over every render */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent"
                    />

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <h3 className="text-lg text-white sm:text-xl">
                        {item.title}
                      </h3>

                      {/* Highlights slide up on hover; always shown on touch */}
                      <ul className="mt-2 space-y-1 text-sm text-white/70 transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)] lg:max-h-0 lg:translate-y-2 lg:overflow-hidden lg:opacity-0 lg:group-hover:max-h-24 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span className="text-gold" aria-hidden="true">
                              —
                            </span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Swipe affordance — the peeking card implies it, this confirms it. */}
        <p className="mt-4 text-center text-xs tracking-[0.14em] text-white/40 uppercase sm:hidden">
          Swipe for all {amenities.items.length} amenities
        </p>
      </div>

      {/* ── Supporting amenities marquee ─────────────────────────────────── */}
      <div
        className="marquee relative mt-10 flex overflow-hidden select-none sm:mt-14"
        aria-label="More amenities at Blanca Ekaiva"
      >
        {/* Edge fades so the loop dissolves rather than cuts off. A 96px fade
            would swallow half a 390px viewport, so phones get a narrow one. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ink to-transparent sm:w-24"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ink to-transparent sm:w-24"
        />

        <div className="marquee-track flex shrink-0">
          {/* Rendered twice so the -50% keyframe loops seamlessly. Each half
              carries its own trailing gap (pr-4) so both are exactly the same
              width — a gap on the track itself would offset the loop by half a
              gap and cause a visible jump. The clone is hidden from assistive
              tech to avoid duplicate announcements. */}
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
              aria-hidden={copy === 1 ? "true" : undefined}
            >
              {amenityChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm whitespace-nowrap text-white/75 sm:px-6 sm:py-3 sm:text-base"
                >
                  {chip}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
