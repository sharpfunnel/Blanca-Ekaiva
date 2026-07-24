import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { spaces } from "@/lib/content";

/**
 * Section 3 — "The Address for Business".
 * Two large cards: office floors and street-facing retail.
 */
export function Spaces() {
  return (
    <section
      id="spaces"
      className="scroll-mt-24 bg-surface py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label={spaces.label}
          heading="The Address for *Business*"
          intro={spaces.intro}
        />

        <div className="mt-10 grid gap-5 sm:mt-14 sm:gap-6 lg:grid-cols-2">
          {spaces.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 140} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)] hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_28px_60px_-30px_rgba(11,11,11,0.35)]">
                {/* Render — scales gently on hover, matching the template */}
                <div className="relative aspect-16/10 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.44,0,0.16,1)] group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent"
                  />
                  <h3 className="absolute bottom-4 left-5 text-2xl text-white sm:bottom-5 sm:left-6 sm:text-4xl">
                    {item.title}
                  </h3>
                </div>

                <div className="flex grow flex-col p-5 sm:p-8">
                  <ul className="space-y-2.5 sm:space-y-3">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Icon
                          name="check"
                          className="mt-1 size-4 shrink-0 text-gold-dark"
                        />
                        <span className="text-base text-body">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted sm:mt-6">
                    {item.sizing}
                  </p>

                  <Button
                    href="#enquire"
                    variant="dark"
                    size="lg"
                    className="mt-5 w-full sm:mt-6"
                  >
                    {item.cta}
                    <Icon name="arrowRight" className="size-5" />
                  </Button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <p className="mt-7 flex items-start justify-center gap-2 text-center text-sm text-muted sm:mt-8 sm:items-center sm:text-base">
            <Icon
              name="shield"
              className="mt-0.5 size-4 shrink-0 text-gold-dark sm:mt-0 sm:size-5"
            />
            {spaces.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
