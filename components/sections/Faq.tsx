import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqs } from "@/lib/content";
import { telHref } from "@/lib/site";

/** Section 9 — FAQ. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-14 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/*
          One flex column on phones, two grid columns from `lg`. The wrapper
          around the heading and the call-out is `display: contents` on mobile
          so both become direct flex items — that is what lets `order-last` push
          the call-out below the accordion, where it belongs once the reader has
          run out of answers rather than before they have read any.
        */}
        <div className="flex flex-col gap-8 sm:gap-10 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="contents lg:block">
            <SectionHeading
              label="FAQ"
              heading="Answers to Common *Questions*"
              intro="The details buyers and investors ask about most before booking a visit."
            />

            <Reveal delay={240} className="order-last lg:mt-8">
              <div className="rounded-card border border-line bg-surface p-5 sm:p-6">
                <p className="text-base text-body">
                  Still have a question? Rahul will answer it directly.
                </p>
                <Button
                  href={telHref}
                  variant="outline"
                  size="lg"
                  className="mt-4 w-full sm:w-auto"
                >
                  <Icon name="phone" className="size-5" />
                  Call Now
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
