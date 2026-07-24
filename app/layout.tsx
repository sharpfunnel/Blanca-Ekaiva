import type { Metadata, Viewport } from "next";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
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

/** Supplied by the client before the campaign goes live. */
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
      {/* `overflow-x: clip` rather than `hidden` — hidden would make the body a
          scroll container and break `position: sticky` inside the page. */}
      <body className="min-h-full overflow-x-clip antialiased">
        {/* Skip link — first tab stop for keyboard and screen-reader users. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        {children}

        {/* Meta Pixel — only injected once the client provides the Pixel ID. */}
        {metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');fbq('track','PageView');`}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}
