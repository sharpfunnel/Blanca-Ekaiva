import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionHeading";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { contact, telHref, whatsappHref } from "@/lib/site";

/**
 * Full-bleed conversion band.
 *
 * Occupies the same slot as the template's emergency-call band — a dark,
 * image-backed interruption between content sections that exists purely to
 * drive a phone call.
 */
export function CallBand() {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-14 sm:py-24">
      <Image
        src="/renders/terrace-night.jpg"
        alt=""
        aria-hidden="true"
        fill
        loading="lazy"
        quality={70}
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-ink/80 backdrop-blur-[2px]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <Reveal>
          <SectionLabel onDark>Private Site Visit</SectionLabel>
        </Reveal>

        <SplitHeading
          text="Ready to See It *In Person?*"
          delay={80}
          className="mt-4 text-[1.75rem] text-white sm:mt-5 sm:text-6xl lg:text-7xl"
        />

        <Reveal delay={260}>
          <p className="mt-4 max-w-2xl text-base text-white/70 sm:mt-5 sm:text-lg">
            Speak to {contact.name} directly for floor plans, current pricing and
            a guided walkthrough of the tower — office or retail.
          </p>
        </Reveal>

        {/* The column is `items-center`, so the wrapper needs the width for the
            stacked phone buttons to reach the full measure. */}
        <Reveal delay={340} className="w-full sm:w-auto">
          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center">
            <Button href={telHref} size="lg">
              <Icon name="phone" className="size-5" />
              {contact.phoneDisplay}
            </Button>
            <Button href={whatsappHref} variant="onDark" size="lg">
              <Icon name="whatsapp" className="size-5" />
              WhatsApp Us
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
