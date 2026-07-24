import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { location } from "@/lib/content";
import { mapEmbedSrc, mapLinkHref, site } from "@/lib/site";

/**
 * Section 5 — location and connectivity.
 * Aerial context render + embedded map + drive-time tiles + landmark chips.
 */
export function Location() {
  return (
    <section
      id="location"
      className="scroll-mt-24 border-b border-line bg-white py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label={location.label}
          heading="If Progress Had an Address — *Turbhe, Navi Mumbai*"
          intro={location.intro}
        />

        <div className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-2">
          {/* Aerial render showing the highway and rail context */}
          <Reveal className="h-full">
            <div className="relative h-full min-h-[220px] overflow-hidden rounded-card border border-line sm:min-h-[320px]">
              <Image
                src="/renders/aerial.jpg"
                alt="Aerial view of Blanca Ekaiva showing its position on the Turbhe highway corridor"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent"
              />
              <p className="absolute inset-x-0 bottom-0 flex items-start gap-2.5 p-5 text-sm text-white sm:p-6 sm:text-base">
                <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-gold" />
                <span>
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </span>
              </p>
            </div>
          </Reveal>

          {/* Google Map, lazy-loaded so it never blocks first paint */}
          <Reveal delay={120} className="h-full">
            <div className="h-full min-h-[260px] overflow-hidden rounded-card border border-line sm:min-h-[320px]">
              <iframe
                src={mapEmbedSrc}
                title={`Map showing ${site.project} at ${site.address.full}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="size-full min-h-[260px] border-0 sm:min-h-[320px]"
              />
            </div>
          </Reveal>
        </div>

        {/* ── Drive times ────────────────────────────────────────────────── */}
        {/* Two up on phones — six full-width rows is a lot of scroll for six
            short figures, and the clock icon stacks above the text to keep the
            tiles readable at half width. */}
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          {location.distances.map((item, i) => (
            <li key={item.place}>
              <Reveal delay={i * 70} className="h-full">
                <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-surface-2 p-4 transition-colors duration-500 hover:border-gold/40 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-gold sm:size-11">
                    <Icon name="clock" className="size-4 sm:size-5" />
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-ink sm:text-2xl">
                      {item.time}
                    </p>
                    <p className="text-sm text-body sm:text-base">
                      {item.place}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* ── Landmarks ──────────────────────────────────────────────────── */}
        <Reveal delay={120}>
          <div className="mt-10 sm:mt-12">
            <h3 className="text-xl">Nearby Landmarks</h3>
            <ul className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
              {location.landmarks.map((landmark) => (
                <li
                  key={landmark}
                  className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-body transition-colors duration-300 hover:border-gold/50 hover:text-ink sm:px-5 sm:py-2.5 sm:text-base"
                >
                  {landmark}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
            <Button href="#enquire" size="lg">
              {location.cta}
              <Icon name="arrowRight" className="size-5" />
            </Button>
            <Button href={mapLinkHref} variant="outline" size="lg">
              <Icon name="pin" className="size-5" />
              Open in Google Maps
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
