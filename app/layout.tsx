import type { Metadata, Viewport } from "next";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { contact, site } from "@/lib/site";

/**
 * Geist for display type and Inter for body copy — the same pairing the
 * reference template loads. `next/font` self-hosts both, so there is no
 * render-blocking request to Google.
 */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Set NEXT_PUBLIC_SITE_URL at deploy time so OG/canonical URLs are absolute. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Google Tag Manager container. Env var overrides the default at deploy time.
 *  NOTE: if this container also fires a Meta tag, conversions double-count —
 *  audit it in Tag Manager and remove any Meta Pixel / Lead tags from it. */
const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-K8NP5ZS2";

const title = `${site.project} — Iconic Offices & Retail Outlets in Turbhe, Navi Mumbai`;
const description =
  "Landmark commercial spaces at Turbhe, Navi Mumbai. Iconic curved-glass elevation, maximum ceiling height, open column structure, rooftop restaurant and 15+ premium amenities. MahaRERA PC1330002600093. Get floor plans and pricing.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: site.project,
  keywords: [
    "Blanca Ekaiva",
    "commercial property Turbhe",
    "office space Navi Mumbai",
    "retail shop Turbhe",
    "MIDC Turbhe commercial",
    "office for sale Navi Mumbai",
    "Ekaiva Group",
  ],
  authors: [{ name: contact.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: site.project,
    title,
    description,
    images: [
      {
        url: "/renders/hummingbird.jpg",
        width: 1600,
        height: 900,
        alt: `${site.project} — iconic commercial tower at Turbhe, Navi Mumbai`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/renders/hummingbird.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${inter.variable}`}>
      <head>
        {/* Google Tag Manager — afterInteractive is Next's recommended strategy
            for tag managers; it injects the loader into <head> at runtime. */}
        {gtmId ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}
      </head>
      {/* `overflow-x: clip` rather than `hidden` — hidden would make the body a
          scroll container and break `position: sticky` inside the page. */}
      <body className="min-h-full overflow-x-clip antialiased">
        {/* Google Tag Manager (noscript) — must sit immediately after <body>. */}
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}

        {/* Skip link — first tab stop for keyboard and screen-reader users. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        {children}

        {/* Meta Pixel — injects itself only when NEXT_PUBLIC_META_PIXEL_ID is
            set, skips /admin, and re-fires PageView on client-side nav. */}
        <MetaPixel />
      </body>
    </html>
  );
}
