import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { LeadForm } from "@/components/ui/LeadForm";
import { Reveal } from "@/components/ui/Reveal";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { hero, heroStats } from "@/lib/content";
import { site, telHref } from "@/lib/site";

/**
 * Section 1 — hero.
 *
 * Mirrors the template's hero composition (eyebrow badge, split-word headline,
 * proof points, paired CTAs, stat strip) over the Blanca wormeye elevation,
 * with the floating lead-capture card the brief asks for on the right.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink pt-24 pb-0 sm:pt-32">
      {/*
        The render is portrait (1600×2286). On mobile the section is far taller
        than the viewport — the lead card and stat strip stack under the copy —
        so an `inset-0` background would `cover` to ~1500px tall and crop the
        tower down to a meaningless vertical sliver. Bounding the image to one
        viewport height below `lg` keeps the whole elevation in frame; the
        section's own `bg-ink` and the bottom fade carry the rest.
      */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[100svh] lg:h-full">
        {/* LCP image, so it is eager and high priority. */}
        <Image
          src="/renders/wormeye.jpg"
          alt={`${site.project} — iconic curved glass tower at Turbhe, Navi Mumbai`}
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover object-[center_18%] lg:object-[center_22%]"
        />

        {/* Legibility scrim: darkest on the left where the copy sits. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/85 to-ink/70 lg:via-ink/70 lg:to-ink/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70"
        />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grow items-center gap-10 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-12 lg:gap-10">
        {/* ── Copy ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          <Reveal>
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/80 uppercase backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm sm:tracking-[0.1em]">
              <span
                className="size-1.5 shrink-0 rounded-full bg-gold"
                aria-hidden="true"
              />
              {/* The full badge is one long line — it truncates to nonsense on a
                  phone, so the short form is swapped in below `sm`. */}
              <span className="truncate sm:hidden">{hero.badgeShort}</span>
              <span className="hidden truncate sm:inline">{hero.badge}</span>
            </span>
          </Reveal>

          <Reveal delay={90}>
            <p className="mt-6 font-display text-base tracking-[0.24em] text-gold uppercase sm:mt-7 sm:text-lg">
              {site.project}
            </p>
          </Reveal>

          <SplitHeading
            as="h1"
            text={hero.headline}
            delay={160}
            className="mt-2 max-w-3xl text-[2.25rem] leading-[1.06] text-white sm:mt-3 sm:text-7xl lg:text-8xl"
          />

          <Reveal delay={420}>
            <p className="mt-4 max-w-2xl font-display text-lg text-white/85 sm:mt-5 sm:text-2xl">
              {hero.headlineAccent}
            </p>
          </Reveal>

          <Reveal delay={500}>
            <p className="mt-4 max-w-xl text-base text-white/65 sm:mt-5 sm:text-lg">
              {hero.subheadline}
            </p>
          </Reveal>

          <Reveal delay={560}>
            <p
              className="mt-3 max-w-xl text-sm text-gold-light/90 italic sm:text-base"
              lang="hi-Latn"
            >
              {hero.hindiSubtext}
            </p>
          </Reveal>

          {/* Proof points — the template's tick row under the sub-headline */}
          <Reveal delay={620}>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 sm:mt-7 sm:gap-x-6 sm:gap-y-3">
              {hero.proofPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-1.5 text-sm text-white/80 sm:gap-2 sm:text-base"
                >
                  <Icon
                    name="check"
                    className="size-3.5 shrink-0 text-gold sm:size-4"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={700}>
            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center">
              <Button href="#enquire" size="lg">
                {hero.primaryCta}
                <Icon name="arrowRight" className="size-5" />
              </Button>
              <Button href={telHref} variant="onDark" size="lg">
                <Icon name="phone" className="size-5" />
                {hero.secondaryCta}
              </Button>
            </div>
          </Reveal>
        </div>

        {/* ── Floating lead card (below the hero copy on mobile) ────────── */}
        <div className="lg:col-span-5">
          <Reveal delay={300}>
            <div className="rounded-card border border-white/12 bg-ink/80 p-5 shadow-2xl backdrop-blur-xl sm:bg-ink/70 sm:p-8">
              <h2 className="text-xl text-white sm:text-2xl">
                Get Price &amp; Floor Plan
              </h2>
              <p className="mt-2 text-sm text-white/60 sm:text-base">
                Share your details and Rahul will send the floor plans and
                current pricing.
              </p>
              <LeadForm variant="compact" onDark className="mt-5 sm:mt-6" />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Stat strip ─────────────────────────────────────────────────── */}
      <Reveal delay={780}>
        <div className="border-t border-white/10 bg-ink/60 backdrop-blur-md">
          {/* 2×2 on phones. The hairline dividers keep the four figures from
              reading as one block of text at that width. */}
          <ul className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
            {heroStats.map((stat, i) => (
              <li
                key={stat.label}
                className={`flex flex-col items-center gap-0.5 py-5 text-center sm:gap-1 sm:py-6 lg:items-start lg:text-left ${
                  i % 2 === 0 ? "border-r border-white/10 lg:border-r-0" : ""
                } ${i < 2 ? "border-b border-white/10 lg:border-b-0" : ""}`}
              >
                <span className="font-display text-2xl font-semibold text-gold sm:text-5xl">
                  {stat.value}
                </span>
                <span className="text-xs text-white/60 sm:text-base">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
