import Image from "next/image";
import { Icon } from "@/components/ui/Icons";
import { LeadForm } from "@/components/ui/LeadForm";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/lib/site";

/**
 * Section 8 — the main lead form.
 *
 * This is the page's primary conversion target and the destination of every
 * "Get Price & Floor Plan" call-to-action above it.
 */
export function LeadFormSection() {
  const assurances = [
    "Floor plans and current pricing shared directly",
    "Office, retail or both — guided by your requirement",
    "Callback within 30 minutes during working hours",
  ];

  return (
    <section
      id="enquire"
      className="scroll-mt-24 border-b border-line bg-white py-14 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Pitch ──────────────────────────────────────────────────── */}
          <div>
            <SectionHeading
              label="Enquire"
              heading={"Get Floor Plans & *Pricing*"}
              intro="Tell us what you are looking for and Rahul will send the complete floor plan set with current pricing."
            />

            <Reveal delay={220}>
              <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                {assurances.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <Icon
                      name="check"
                      className="mt-0.5 size-5 shrink-0 text-gold-dark sm:mt-1"
                    />
                    <span className="text-base text-body sm:text-lg">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Decorative on mobile, where it would only push the form — the
                page's primary conversion target — a screen further down. */}
            <Reveal delay={300} className="hidden lg:block">
              <div className="relative mt-10 aspect-16/10 overflow-hidden rounded-card border border-line">
                <Image
                  src="/renders/duplex-lobby.jpg"
                  alt="Grand entrance lobby at Blanca Ekaiva"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          {/* ── Form ───────────────────────────────────────────────────── */}
          <div>
            <Reveal delay={140}>
              <div className="rounded-card border border-line bg-surface-2 p-5 shadow-[0_28px_60px_-40px_rgba(11,11,11,0.4)] sm:p-9 lg:sticky lg:top-28">
                <LeadForm variant="full" submitLabel="Get Details" />

                <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted sm:text-sm">
                  MahaRERA No.{" "}
                  <span className="font-medium text-ink-3">
                    {site.reraNumber}
                  </span>{" "}
                  — project details available at{" "}
                  <a
                    href={site.reraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 transition-colors duration-300 hover:text-gold-dark"
                  >
                    maharera.maharashtra.gov.in
                  </a>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
