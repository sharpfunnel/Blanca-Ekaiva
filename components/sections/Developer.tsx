import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { developer } from "@/lib/content";

/**
 * Section 6 — developer credibility.
 *
 * The brief calls for thumbnails of the four completed projects, but no
 * photography for them exists on the reference site. Rather than substitute
 * unrelated stock imagery, each project is presented as a typographic card in
 * the same visual language — drop real photos into the cards when the client
 * supplies them.
 */
export function Developer() {
  return (
    <section
      id="developer"
      className="scroll-mt-24 bg-surface py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionHeading
            label={developer.label}
            heading="Built on a Foundation of *Trust*"
            intro={developer.body}
          />

          <Reveal delay={140}>
            <div className="rounded-card border border-line bg-white p-6 sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Icon name="shield" className="size-6" />
              </span>
              <p className="mt-5 font-display text-xl leading-snug text-ink sm:text-2xl">
                {developer.trustLine}
              </p>
              <p className="mt-4 text-base text-body">
                Blanca is the premium arm of Ekaiva Group, with a delivery record
                across Ulwe, Kamothe and greater Navi Mumbai.
              </p>
            </div>
          </Reveal>
        </div>

        {/* ── Completed projects ─────────────────────────────────────────── */}
        {/* Four short typographic cards read fine two-up on a phone. */}
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-4">
          {developer.projects.map((project, i) => (
            <li key={project.name}>
              <Reveal delay={i * 100} className="h-full">
                <article className="group flex h-full flex-col justify-between rounded-card border border-line bg-white p-4 transition-all duration-500 ease-[cubic-bezier(0.44,0,0.16,1)] hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_20px_48px_-24px_rgba(11,11,11,0.28)] sm:p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-ink text-gold transition-colors duration-500 group-hover:bg-gold group-hover:text-ink sm:size-12">
                    <Icon name="building" className="size-5 sm:size-6" />
                  </span>

                  <div className="mt-6 sm:mt-8">
                    <h3 className="text-lg sm:text-xl">{project.name}</h3>
                    <p className="mt-1 text-sm text-body sm:text-base">
                      {project.place}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] text-gold-dark uppercase sm:mt-4 sm:text-sm">
                      <Icon name="check" className="size-3.5 sm:size-4" />
                      Completed
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
