import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { whyBlanca } from "@/lib/content";

/**
 * Section 2 — "More Space. Per Space."
 * Four icon cards, staggered in on scroll like the template's benefits row.
 */
export function WhyBlanca() {
  return (
    <section
      id="why"
      className="scroll-mt-24 border-b border-line bg-white py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          label={whyBlanca.label}
          heading="More Space. *Per Space.*"
          intro={whyBlanca.intro}
          align="center"
        />

        <ul className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {whyBlanca.items.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={i * 110} className="h-full">
                {/* Icon sits beside the copy on phones — four stacked cards with
                    the icon above the title runs to nearly a full screen each. */}
                <article className="group flex h-full flex-row items-start gap-4 rounded-card border border-line bg-surface-2 p-5 transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)] hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_20px_48px_-24px_rgba(11,11,11,0.28)] sm:flex-col sm:gap-0 sm:p-7">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-gold transition-colors duration-500 group-hover:bg-gold group-hover:text-ink sm:size-14">
                    <Icon name={item.icon} className="size-6 sm:size-7" />
                  </span>

                  <div>
                    <h3 className="text-xl sm:mt-6 sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-base text-body sm:mt-3">
                      {item.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
