import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  contact,
  mailHref,
  site,
  telHref,
  whatsappHref,
} from "@/lib/site";

/**
 * Section 7 — channel partner contact card.
 *
 * Identity on this page is Rahul Thakur as channel partner for Blanca Ekaiva
 * only; per the brief no agency name, logo or branding appears anywhere.
 */
export function ContactCard() {
  const details = [
    {
      icon: "phone" as const,
      label: "Phone / WhatsApp",
      value: contact.phoneDisplay,
      href: telHref,
    },
    {
      icon: "mail" as const,
      label: "Email",
      value: contact.email,
      href: mailHref,
    },
    {
      icon: "pin" as const,
      label: "Based in",
      value: contact.location,
      href: undefined,
    },
  ];

  return (
    <section id="contact" className="scroll-mt-24 bg-ink py-14 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <SectionHeading
            label="Your Point of Contact"
            heading="Talk to Someone Who *Knows the Tower*"
            intro={`Every enquiry is handled personally by the ${contact.role}. No call centres, no runaround.`}
            onDark
          />

          <Reveal delay={140}>
            <div className="rounded-card border border-white/12 bg-white/5 p-5 backdrop-blur-sm sm:p-9">
              {/* Identity */}
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold font-display text-xl font-semibold text-ink sm:size-16 sm:text-2xl">
                  {contact.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xl text-white sm:text-2xl">
                    {contact.name}
                  </p>
                  <p className="text-sm text-gold sm:text-base">
                    {contact.role}
                  </p>
                </div>
              </div>

              {/* Details */}
              <ul className="mt-6 space-y-4 border-t border-white/10 pt-6 sm:mt-8 sm:space-y-5 sm:pt-8">
                {details.map((detail) => (
                  <li key={detail.label} className="flex items-start gap-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/8 text-gold">
                      <Icon name={detail.icon} className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] tracking-[0.1em] text-white/45 uppercase sm:text-sm">
                        {detail.label}
                      </p>
                      {/* The email overflows a 390px card if it cannot break —
                          truncating it would hide the address outright. */}
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="block py-1.5 text-base break-words text-white transition-colors duration-300 hover:text-gold sm:text-lg"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="text-base text-white sm:text-lg">
                          {detail.value}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                <Button href="#enquire" size="lg" className="sm:flex-1">
                  Request a Callback
                </Button>
                <Button href={whatsappHref} variant="onDark" size="lg">
                  <Icon name="whatsapp" className="size-5" />
                  WhatsApp
                </Button>
              </div>

              <p className="mt-6 text-xs text-white/40 sm:text-sm">
                Authorised channel partner for {site.project}. MahaRERA No.{" "}
                {site.reraNumber}.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
