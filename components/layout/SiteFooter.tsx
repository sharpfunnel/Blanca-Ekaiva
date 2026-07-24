import { Icon } from "@/components/ui/Icons";
import { Wordmark } from "./Wordmark";
import {
  contact,
  mailHref,
  site,
  telHref,
  whatsappHref,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/70">
      {/* The extra mobile bottom padding clears the fixed StickyActions bar. */}
      <div className="mx-auto max-w-7xl px-5 pt-14 pb-32 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          {/* Identity */}
          <div>
            <Wordmark />
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/60">
              Iconic offices and retail outlets at {site.address.line1},{" "}
              {site.address.line2}.
            </p>
            <p className="mt-4 text-sm tracking-[0.14em] text-gold uppercase">
              {site.tagline}
            </p>
          </div>

          {/* Channel partner contact */}
          <div>
            <h2 className="text-base font-semibold tracking-[0.14em] text-white uppercase">
              Enquiries
            </h2>
            <p className="mt-5 text-lg font-medium text-white">{contact.name}</p>
            <p className="text-sm text-white/55">{contact.role}</p>
            <p className="text-sm text-white/55">{contact.location}</p>

            {/* `py-2` on the links rather than spacing on the list items: it
                grows the tap target itself past the 24px minimum instead of
                just the dead space around it. */}
            <ul className="mt-4 space-y-1 text-base">
              <li>
                <a
                  href={telHref}
                  className="inline-flex items-center gap-2.5 py-2 transition-colors duration-300 hover:text-gold"
                >
                  <Icon name="phone" className="size-[18px] shrink-0" />
                  {contact.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={mailHref}
                  className="inline-flex items-center gap-2.5 py-2 transition-colors duration-300 hover:text-gold"
                >
                  <Icon name="mail" className="size-[18px] shrink-0" />
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-2 transition-colors duration-300 hover:text-gold"
                >
                  <Icon name="whatsapp" className="size-[18px] shrink-0" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Project references */}
          <div>
            <h2 className="text-base font-semibold tracking-[0.14em] text-white uppercase">
              Project
            </h2>
            <ul className="mt-4 space-y-1 text-base">
              <li className="flex items-start gap-2.5 py-2">
                <Icon name="pin" className="mt-1 size-[18px] shrink-0" />
                <span>
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                </span>
              </li>
              <li>
                <a
                  href={site.corporateSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-2 transition-colors duration-300 hover:text-gold"
                >
                  blanca.co.in
                  <Icon name="arrowUpRight" className="size-4" />
                </a>
              </li>
              <li>
                <a
                  href={site.reraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-2 transition-colors duration-300 hover:text-gold"
                >
                  maharera.maharashtra.gov.in
                  <Icon name="arrowUpRight" className="size-4" />
                </a>
              </li>
            </ul>

            <p className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm">
              MahaRERA No.{" "}
              <span className="ml-1.5 font-medium text-white">
                {site.reraNumber}
              </span>
            </p>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-12 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/45 sm:mt-14 sm:text-sm">
          <p>
            This page is operated by {contact.name}, an authorised channel
            partner for {site.project}. It is a marketing communication and does
            not constitute an offer or contract. All images are architect&rsquo;s
            renders and are indicative only. Unit sizes, layouts, pricing and
            amenities are subject to change and confirmation by the developer.
          </p>
          <p className="mt-4">
            MahaRERA No. {site.reraNumber} — full project details available at{" "}
            <a
              href={site.reraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-white"
            >
              maharera.maharashtra.gov.in
            </a>
            .
          </p>
          <p className="mt-6">
            &copy; {new Date().getFullYear()} {site.project}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
