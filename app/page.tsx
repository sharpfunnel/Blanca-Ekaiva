import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StickyActions } from "@/components/layout/StickyActions";
import { Tracker } from "@/components/track/Tracker";
import { Amenities } from "@/components/sections/Amenities";
import { CallBand } from "@/components/sections/CallBand";
import { ContactCard } from "@/components/sections/ContactCard";
import { Developer } from "@/components/sections/Developer";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { LeadFormSection } from "@/components/sections/LeadFormSection";
import { Location } from "@/components/sections/Location";
import { Spaces } from "@/components/sections/Spaces";
import { WhyBlanca } from "@/components/sections/WhyBlanca";
import { faqs } from "@/lib/content";
import { contact, site } from "@/lib/site";

/**
 * Single-scroll lead generation landing page for Blanca Ekaiva, Turbhe.
 * Section order follows the client brief.
 */

/** Structured data — FAQ rich results plus the project and contact entities. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@type": "Place",
      name: site.project,
      description:
        "Iconic commercial offices and retail outlets at Turbhe, Navi Mumbai.",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.line1,
        addressLocality: "Turbhe, Navi Mumbai",
        addressRegion: "Maharashtra",
        postalCode: "400705",
        addressCountry: "IN",
      },
    },
    {
      "@type": "RealEstateAgent",
      name: contact.name,
      description: contact.role,
      telephone: contact.phoneE164,
      email: contact.email,
      areaServed: "Navi Mumbai",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Content is a build-time constant, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      {/* Visitor tracking — landing page only (admin routes are never tracked) */}
      <Tracker />

      <main id="main">
        {/* 1 — Hero + floating lead form */}
        <Hero />
        {/* 2 — More Space. Per Space. */}
        <WhyBlanca />
        {/* 3 — Office & retail spaces */}
        <Spaces />
        {/* 4 — Amenities showcase */}
        <Amenities />
        {/* Conversion band */}
        <CallBand />
        {/* 5 — Location & connectivity */}
        <Location />
        {/* 6 — Developer credibility */}
        <Developer />
        {/* 7 — Channel partner contact card */}
        <ContactCard />
        {/* 8 — Lead form */}
        <LeadFormSection />
        {/* 9 — FAQ */}
        <Faq />
      </main>

      <SiteFooter />

      {/* Sticky WhatsApp (all breakpoints) + Call (mobile) */}
      <StickyActions />
    </>
  );
}
