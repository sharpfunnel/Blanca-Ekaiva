# Blanca Ekaiva — Landing Page

Single-scroll lead generation landing page for **Blanca Ekaiva**, a commercial
development (iconic offices & retail outlets) at Turbhe, Navi Mumbai.

Built with Next.js 16 (App Router) and Tailwind CSS v4. The page is fully
static — it prerenders to HTML at build time.

## Design reference

The visual system is a reproduction of the **Plumbing Pro** Framer template
([plumbingpro.framer.website](https://plumbingpro.framer.website/)), populated
with Blanca Ekaiva content. Everything below was extracted from the template's
own stylesheet and markup rather than eyeballed:

| Token          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Neutral ramp   | `#0b0b0b` `#1a1a1a` `#262626` `#4d4d4d` `#757575` `#e6e6e6` … |
| Type scale     | 12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 31 · 36 · 38 · 48 · 60 px |
| Card radius    | `16px`                                                       |
| Button radius  | `50px` (pill); outline variant uses a 2px border              |
| Fonts          | Geist (display) + Inter (body)                               |

Two deliberate substitutions:

- **Accent colour.** The template's accent (`#ff5e15` / `#2563eb`) is re-mapped
  to a Blanca gold (`--color-gold: #c5a059`). The client's own marketing
  creatives use gold on deep navy, and the brief specifies gold CTAs. It is a
  single token in `app/globals.css` if it ever needs to change.
- **Navy.** `#142f45` is the template's own token and doubles as the Blanca
  brand navy, so no substitution was needed.

Gold is paired with ink (`#0b0b0b`) text on buttons rather than white — gold on
white fails WCAG contrast.

## Content & structure

All copy lives in `lib/content.ts` and `lib/site.ts` so it can be edited without
touching components. Section order follows the client brief:

1. Hero + floating lead form + stat strip
2. Why Blanca Ekaiva — "More Space. Per Space."
3. Office & Retail Spaces
4. Amenities showcase (8 cards + marquee)
5. Private site-visit conversion band
6. Location & connectivity (aerial render + Google Map + drive times)
7. Developer credibility
8. Channel partner contact card
9. Lead form (`#enquire`) + FAQ + footer

Plus a sticky WhatsApp button (all breakpoints) and a sticky Call button
(mobile), per the brief.

Per the brief there is **no navigation menu** — the header carries identity and
the two conversion actions only.

## Assets

Architectural renders in `public/renders/` were extracted from the client's
reference site ([blancacp-konnect.vercel.app](https://blancacp-konnect.vercel.app/))
and are served through `next/image` (AVIF/WebP negotiation, responsive
`sizes`, lazy loading below the fold, `priority` on the hero).

The reference site's numbered PNGs were marketing posters with baked-in text,
logos and a different phone number, so they are not used — only the clean
render photography is.

## Environment variables

All optional; the page works without them.

| Variable                   | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | Absolute base for canonical + Open Graph URLs. Set on deploy.   |
| `NEXT_PUBLIC_META_PIXEL_ID`| Meta Pixel. When set, injects the pixel and fires `PageView`.   |
| `NEXT_PUBLIC_LEAD_WEBHOOK` | POST target for leads (Google Sheet / Zapier / CRM).           |

## Lead flow

On submit the form validates the name and a 10-digit Indian mobile number,
fires the Meta Pixel `Lead` conversion event, POSTs to `NEXT_PUBLIC_LEAD_WEBHOOK`
if configured, and hands the lead to WhatsApp with a pre-filled message. An
inline success state replaces the brief's separate thank-you page.

The WhatsApp window is opened synchronously inside the submit handler so
browsers treat it as user-initiated; the webhook POST is fire-and-forget and can
never block or fail the hand-off.

## Accessibility & motion

- Skip link, labelled form fields with `aria-invalid` / `aria-describedby`,
  `aria-expanded` accordion triggers, and a visible gold focus ring.
- Scroll animations are driven by `IntersectionObserver` + CSS transitions (no
  animation library). `prefers-reduced-motion: reduce` disables all of it and
  forces content to its revealed state.

## Pending from the client

Called out in the brief and not inventable here:

- Office and retail unit sizes and pricing (currently "shared on enquiry")
- High-resolution Blanca / Ekaiva logo files — the identity is currently set as
  a typographic wordmark (`components/layout/Wordmark.tsx`)
- Photography for the four completed projects — currently typographic cards
- Meta Pixel ID and the confirmed lead destination

## Development

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
npm run lint
```
# Blanca-Ekaiva
