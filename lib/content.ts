/**
 * All page copy in one place, so the client can edit content without touching
 * component code. Section numbering follows the developer brief.
 */

import type { IconName } from "@/components/ui/Icons";

/* ── Section 1 — Hero ─────────────────────────────────────────────────── */

export const hero = {
  badge:
    "Iconic Offices & Retail Outlets · Turbhe, Navi Mumbai · MahaRERA PC1330002600093",
  /** Phone-width version — the full badge truncates to nonsense at 390px. */
  badgeShort: "Offices & Retail · Turbhe, Navi Mumbai",
  /** Asterisks mark the words SplitHeading renders in gold. */
  headline: "Where Business Meets *Luxury*",
  headlineAccent: "Commercial Spaces Built for the Class Apart",
  subheadline:
    "Landmark office and retail spaces at Turbhe, Navi Mumbai — iconic elevation, maximum ceiling height, open column structure, rooftop restaurant and 15+ premium amenities.",
  hindiSubtext:
    "Commercial space jo aapki pehchaan banaye — Navi Mumbai ke dil mein.",
  /** Three proof points shown under the sub-headline, template-style. */
  proofPoints: [
    "MahaRERA Registered",
    "Iconic Curved Glass Tower",
    "Office & Retail Available",
  ],
  primaryCta: "Get Price & Floor Plan",
  secondaryCta: "Call Rahul Thakur",
} as const;

/** Stat bar pinned to the bottom of the hero. */
export const heroStats = [
  { value: "5 Min", label: "From Turbe & Juinagar Station" },
  { value: "20 Min", label: "From New Airport" },
  { value: "700+", label: "Car Parking" },
  { value: "15+", label: "Premium Amenities" },
] as const;

/* ── Section 2 — Why Blanca Ekaiva ────────────────────────────────────── */

export const whyBlanca = {
  label: "Why Blanca Ekaiva",
  heading: "More Space. Per Space.",
  intro:
    "Every design decision at Blanca Ekaiva is made to give you more usable business space — more volume, more flexibility, more presence.",
  items: [
    {
      icon: "tower" as IconName,
      title: "Iconic Elevation",
      body: "A landmark curved glass facade that makes your business address instantly recognisable across Navi Mumbai.",
    },
    {
      icon: "height" as IconName,
      title: "Maximum Ceiling Height",
      body: "More usable volume per sq.ft — open, airy and unmistakably premium the moment you walk in.",
    },
    {
      icon: "columns" as IconName,
      title: "Open Column Structure",
      body: "Full flexibility to design your ideal workspace, with full-length windows and uninterrupted floor plates.",
    },
    {
      icon: "sparkle" as IconName,
      title: "15+ Amenities",
      body: "Rooftop restaurant, gymnasium, conference room, WiFi pods, games room and a dedicated leisure floor.",
    },
  ],
} as const;

/* ── Section 3 — Office & Retail Spaces ───────────────────────────────── */

export const spaces = {
  label: "Office & Retail",
  heading: "The Address for Business",
  intro:
    "Two ways to own a piece of Navi Mumbai's most distinctive commercial tower.",
  note: "Floor plans and pricing shared on enquiry.",
  items: [
    {
      title: "Office Spaces",
      image: "/renders/office-workstation.jpg",
      alt: "Blanca Ekaiva office workstation render with full-length windows",
      features: [
        "Open column structure — column-free, flexible layouts",
        "Maximum floor-to-ceiling height",
        "Full-length windows with natural light throughout",
        "Magnificent panoramic views from upper floors",
        "Suitable for startups, SMEs and corporate HQs",
      ],
      sizing: "Unit sizes & pricing — shared on enquiry",
      cta: "Get Office Details",
    },
    {
      title: "Retail Outlets",
      image: "/renders/retail-shop.jpg",
      alt: "Blanca Ekaiva street-facing retail showroom render",
      features: [
        "Street facing with supreme frontage",
        "Spacious showrooms, maximum ceiling height",
        "Ideal for mega brands and premium retail",
        "High footfall from 700+ parking and office occupants",
        "Prime visibility on the MIDC Turbhe arterial road",
      ],
      sizing: "Unit sizes & pricing — shared on enquiry",
      cta: "Get Retail Details",
    },
  ],
} as const;

/* ── Section 4 — Amenities ────────────────────────────────────────────── */

export const amenities = {
  label: "Amenities",
  heading: "Crafting the Art of Indulgence",
  intro:
    "A grand 11th floor dedicated to leisure and wellness, plus a rooftop restaurant open to the sky.",
  items: [
    {
      title: "Rooftop Restaurant",
      image: "/renders/terrace-day.jpg",
      alt: "Rooftop restaurant at Blanca Ekaiva with open-sky seating",
      points: ["Elegant interiors, open to the sky", "Panoramic city vistas"],
    },
    {
      title: "Conference Room",
      image: "/renders/conference-hall.jpg",
      alt: "Conference room with boardroom seating and digital display",
      points: ["Audio-visual systems", "Large digital display"],
    },
    {
      title: "Gymnasium",
      image: "/renders/gym.jpg",
      alt: "Well-equipped gymnasium with imported machines",
      points: ["Imported machines", "World-class trainers"],
    },
    {
      title: "Indoor Games Room",
      image: "/renders/recreational-3.jpg",
      alt: "Indoor games room with pool and table tennis",
      points: ["Pool, table tennis and more", "State-of-the-art equipment"],
    },
    {
      title: "Cafeteria",
      image: "/renders/recreational-2.jpg",
      alt: "Cafeteria with communal marble seating",
      points: ["Large operating area", "Easy access point"],
    },
    {
      title: "Open Sky Seating",
      image: "/renders/terrace-night.jpg",
      alt: "Open sky seating area with cityscape views at night",
      points: ["Wide cityscape views", "Rejuvenating arrangement"],
    },
    {
      title: "WiFi Pod",
      image: "/renders/recreational-1.jpg",
      alt: "WiFi pod lounge with superfast connectivity",
      points: ["Superfast WiFi zone", "Futuristic, exclusive design"],
    },
    {
      title: "Biophilic Walking Zone",
      image: "/renders/duplex-lobby.jpg",
      alt: "Biophilic pathway with integrated greenery",
      points: ["Nature-integrated pathway", "Wellness-centric design"],
    },
  ],
} as const;

/** Secondary amenity chips rendered as a marquee under the grid. */
export const amenityChips = [
  "Grand Entrance Lobby",
  "Italian Marbled Edifice",
  "Dynamic Valet Parking",
  "11-Level Parking",
  "2-Level Basement Driveway",
  "Open Meditation Space",
  "Chit Chat Corner",
  "Informal Sitting",
  "Green Lounge Seating",
  "Solar Panels",
  "Well-Lit Promenade",
  "Tech-Enhanced Reception",
] as const;

/* ── Section 5 — Location & connectivity ──────────────────────────────── */

export const location = {
  label: "Location",
  heading: "If Progress Had an Address — Turbhe, Navi Mumbai",
  intro:
    "At the centre of Navi Mumbai's commercial corridor, minutes from the rail, road and air links that matter.",
  distances: [
    { time: "5 min", place: "Turbhe Railway Station" },
    { time: "15 min", place: "Vashi & Nerul" },
    { time: "20 min", place: "Navi Mumbai Intl. Airport" },
    { time: "25 min", place: "Atal Setu" },
    { time: "25 min", place: "Upcoming Metro" },
    { time: "50 min", place: "South Mumbai" },
  ],
  landmarks: [
    "IKEA Turbhe",
    "Inorbit Mall",
    "Marriott & Ibis Hotels",
    "Taj Vivanta",
    "MGM Hospital",
    "Mindspace Juinagar",
    "APMC Market",
    "Turbhe MIDC",
    "Yogi Midtown Hotel",
    "Parsik Mountain Range",
    "KT Link Road Tunnel",
    "Sanpada & Juinagar Stations",
  ],
  cta: "Ask About This Location",
} as const;

/* ── Section 6 — Developer credibility ────────────────────────────────── */

export const developer = {
  label: "The Developer",
  heading: "Built on a Foundation of Trust",
  body: "Blanca is the premium arm of Ekaiva Group — committed to quality, timely delivery, and redefining the standard for commercial real estate in Navi Mumbai.",
  trustLine:
    "Multiple completed residential projects in Navi Mumbai — now bringing the same trust to commercial.",
  projects: [
    { name: "ND Garden", place: "Ulwe, Navi Mumbai" },
    { name: "ND Pearl", place: "Kamothe, Navi Mumbai" },
    { name: "Gajanand Krupa", place: "Ulwe, Navi Mumbai" },
    { name: "ND Tower", place: "Ulwe, Navi Mumbai" },
  ],
} as const;

/* ── Section 8 — Lead form options ────────────────────────────────────── */

export const interestOptions = ["Office", "Retail", "Both"] as const;

export const budgetOptions = [
  "Under ₹1 Cr",
  "₹1 Cr – ₹2 Cr",
  "₹2 Cr – ₹5 Cr",
  "₹5 Cr+",
  "Not sure yet",
] as const;

/* ── Section 9 — FAQ ──────────────────────────────────────────────────── */

export const faqs = [
  {
    q: "What is Blanca Ekaiva?",
    a: "Blanca Ekaiva is a luxury commercial development by Blanca — Quintessential Luxury, the premium arm of Ekaiva Group. It offers iconic offices and retail outlets in an instantly recognisable curved glass tower at Turbhe, Navi Mumbai, built around the idea of more space per space.",
  },
  {
    q: "What type of spaces are available — office or retail?",
    a: "Both. Office floors feature an open column structure, maximum floor-to-ceiling height and full-length windows, suitable for startups, SMEs and corporate headquarters. Street-facing retail outlets offer supreme frontage and spacious showrooms ideal for mega brands and premium retail.",
  },
  {
    q: "What are the unit sizes and pricing?",
    a: "Unit configurations and current pricing are shared directly on enquiry, along with the detailed floor plan set. Submit the form or call Rahul Thakur on +91 96993 22332 and you will receive the floor plans and the latest price list.",
  },
  {
    q: "Where exactly is it located in Turbhe?",
    a: "Plot No. D-267, TTC Industrial Area, MIDC, Turbhe, Navi Mumbai — 400 705. It is roughly 5 minutes from Turbhe Railway Station, 15 minutes from Vashi and Nerul, 20 minutes from the Navi Mumbai International Airport and 25 minutes from the Atal Setu.",
  },
  {
    q: "Is the project MahaRERA registered?",
    a: "Yes. Blanca Ekaiva is registered under MahaRERA No. PC1330002600093. Full registration details can be verified at maharera.maharashtra.gov.in.",
  },
  {
    q: "What amenities does the building have?",
    a: "A grand 11th floor is dedicated to leisure and wellness — gymnasium, indoor games room, cafeteria, open meditation space and informal seating — alongside a rooftop restaurant open to the sky, conference room, WiFi pods, a biophilic walking zone, solar panels, dynamic valet parking and 11 levels of parking for approximately 700+ vehicles.",
  },
] as const;
