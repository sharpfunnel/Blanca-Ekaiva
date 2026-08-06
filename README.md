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

| Variable                    | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Absolute base for canonical + Open Graph URLs. Set on deploy.   |
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser Pixel. When set, injects the pixel and fires `PageView`.|
| `META_PIXEL_ID`             | Same id, server side, for the Conversions API.                  |
| `META_CAPI_ACCESS_TOKEN`    | Events Manager → Settings → Generate access token.              |
| `META_GRAPH_API_VERSION`    | Optional; defaults to `v21.0`.                                  |
| `META_CAPI_TEST_EVENT_CODE` | Testing only. **Must be unset in production.**                  |
| `NEXT_PUBLIC_GTM_ID`        | Google Tag Manager container. Must not contain a Meta tag.      |
| `NEXT_PUBLIC_LEAD_WEBHOOK`  | POST target for leads (Google Sheet / Zapier / CRM).            |
| `META_APP_ID` / `META_APP_SECRET` | Meta app with `ads_read`, for the Ads sync OAuth flow.    |
| `CRON_SECRET`               | Guards `/api/cron/meta-sync`. Unset ⇒ the route refuses to run. |

`NEXT_PUBLIC_*` values are inlined at **build** time — changing one needs a
redeploy, not a restart.

## Meta conversion tracking

One conversion per lead, counted twice by nothing:

- **Browser** — `components/analytics/MetaPixel.tsx` injects the pixel, skips
  `/admin`, and re-fires `PageView` on client-side navigation. Every call uses
  `fbq("trackSingle", …)`, never `track`: plain `track` broadcasts to every
  pixel initialised on the page, and the GTM container could be running one.
- **Server** — `lib/meta/capi.ts` POSTs a `Lead` event to the Conversions API
  from `after()` in the lead route: fire-and-forget, never awaited, never able
  to fail the lead. The outcome lands on `Lead.metaCapiSentAt` /
  `metaCapiError`.
- **Dedup** — both halves use the Lead row's id as the event id (browser
  `eventID`, server `event_id`), so Meta collapses them into one conversion.
- **Manual re-send** — the leads table has a per-row Send modal for offline
  conversions and failed sends. It previews the exact JSON the server will POST
  (token redacted) and takes only a row id plus the operator's choices; all PII
  is re-read server-side.

## Admin panel

`/admin` is a first-party analytics panel and lead CRM — no third-party
analytics SaaS. Everything is captured by `lib/track/` and stored in our own
Postgres. Pages are client components reading `/api/admin/*`; the Edge proxy
(`proxy.ts`) guards every `/admin/**` route on a signed session cookie.

| Route | What it answers |
|---|---|
| `/admin` | The daily check: stat tiles, visitors chart, funnel, sources, world map, recent leads |
| `/admin/leads` | The CRM — every enquiry, filterable, with a behavioural detail drawer |
| `/admin/sessions` | Every visit with device/geo/engagement context and a replay button |
| `/admin/campaigns` | Meta Ads spend joined against the sessions and leads it produced |
| `/admin/funnels` | Page View → Scroll → CTA → Form Start → Lead, all traffic vs Meta-ads-only |
| `/admin/ctas` | Per-`data-cta-id` views / hovers / clicks / CTR |
| `/admin/forms` | Per-`data-form-id` views / starts / completions / abandons |
| `/admin/heatmap` | Click, hover and scroll heatmaps over the live page |
| `/admin/performance` | Core Web Vitals distribution from real visitors |
| `/admin/errors` | Client-side errors, grouped |
| `/admin/tech-stack` | Devices, browsers, OS, resolutions, networks |
| `/admin/meta-capi` | Dry-run CAPI payload composer + the delivery log |
| `/admin/reports` | Date-ranged CSV / XLSX / PDF exports |

### Tracking conventions

Two markup attributes are the whole tracking API for new elements — no
JavaScript change is needed to track one:

- **`data-cta-id="hero-call"`** on any button or link → view, hover and click
  are recorded against that stable id, and it appears on `/admin/ctas`.
- **`data-form-id="enquiry-lead-form"`** on a `<form>` → view, start, per-field
  focus/complete/validation-error, submit and abandon. Only field *names* are
  ever recorded; never what anyone typed.

Collectors live in `lib/track/collectors/` (CTA, forms, mouse, vitals, errors)
and share one batched queue that flushes on a timer, at 20 events, or on
tab-hide via `sendBeacon`.

### The world map is real

`lib/admin/worldMapPaths.ts` is **generated**, not hand-drawn: the public-domain
Natural Earth 110m dataset projected through `d3-geo`'s
`geoEquirectangular().fitExtent()` and emitted as plain SVG path data plus
per-country centroids. `d3-geo`, `topojson-client`, `world-atlas` and
`i18n-iso-countries` are installed with `npm install --no-save` for that one run
and removed straight after, so the app ships no map library — just static path
data. Regenerate with:

```bash
npm install --no-save world-atlas d3-geo topojson-client i18n-iso-countries
node scripts/generate-world-map.mjs
npm install --no-save     # drop them again
```

### Meta Ads sync

Connect an ad account from `/admin/campaigns` (OAuth, `ads_read` only). The
long-lived token is stored on `MetaAdAccount` and refreshed when it is within a
week of expiring. Schedule the sync by hitting:

```
GET /api/cron/meta-sync   Authorization: Bearer $CRON_SECRET
```

## Lead flow

On submit the form validates the name and a 10-digit Indian mobile number,
creates the lead via `/api/track/lead`, fires the Meta Pixel `Lead` event with
the returned lead id as its `eventID`, POSTs to `NEXT_PUBLIC_LEAD_WEBHOOK` if
configured, and redirects to `/thank-you?leadId=…` where budget, email and a
message can optionally be added to the same row.

The webhook POST is fire-and-forget and can never block or fail the hand-off.

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
