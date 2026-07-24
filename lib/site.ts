/**
 * Site-wide constants: identity, contact routing and tracking.
 *
 * Per the client brief the page is published under the channel-partner identity
 * of Rahul Thakur for Blanca Ekaiva only — no agency name, logo or branding
 * appears anywhere on the page.
 */

export const site = {
  project: "Blanca Ekaiva",
  developer: "Blanca — Quintessential Luxury | Ekaiva Group",
  tagline: "More Space Per Space",
  positioning: "Quintessential Luxury",
  reraNumber: "PC1330002600093",
  reraUrl: "https://maharera.maharashtra.gov.in",
  corporateSite: "https://www.blanca.co.in",
  projectSite: "https://www.blancaturbhe.com",
  address: {
    line1: "Plot No. D-267, TTC Industrial Area",
    line2: "MIDC, Turbhe, Navi Mumbai — 400 705",
    full: "Plot No. D-267, TTC Industrial Area, MIDC, Turbhe, Navi Mumbai 400 705",
  },
} as const;

export const contact = {
  name: "Rahul Thakur",
  role: "Channel Partner for Blanca Ekaiva",
  location: "Vashi, Navi Mumbai",
  /** E.164, used for tel: and wa.me links */
  phoneE164: "+919699322332",
  phoneDisplay: "+91 96993 22332",
  email: "estatebuddy55@gmail.com",
} as const;

/** Pre-filled WhatsApp message specified in the brief. */
export const whatsappMessage =
  "Hi, I am interested in Blanca Ekaiva, Turbhe. Please share details.";

export const whatsappHref = `https://wa.me/${contact.phoneE164.replace(
  /\D/g,
  ""
)}?text=${encodeURIComponent(whatsappMessage)}`;

export const telHref = `tel:${contact.phoneE164}`;
export const mailHref = `mailto:${contact.email}`;

/**
 * Google Maps embed pinned to Plot D-267, TTC Industrial Area, MIDC, Turbhe.
 * Uses the keyless `/maps?q=&output=embed` form so the page works without a
 * Maps API key; swap to the Embed API if the client provides one.
 */
export const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  site.address.full
)}&z=15&output=embed`;

export const mapLinkHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  site.address.full
)}`;
