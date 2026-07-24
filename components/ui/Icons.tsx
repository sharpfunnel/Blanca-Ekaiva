/**
 * Inline SVG icon set.
 *
 * Kept as raw paths rather than an icon package so the page ships zero extra
 * runtime JS. Every glyph is drawn on a 24x24 grid with a 1.5 stroke so the
 * set stays optically consistent with the reference template.
 */

import type { SVGProps } from "react";

const paths = {
  /** Curved-glass tower — the Blanca elevation */
  tower:
    "M9 21V8a3 3 0 0 1 6 0v13M9 21h6M4 21h16M12 5V3M10 12h4M10 16h4",
  /** Floor-to-ceiling height */
  height: "M12 3v18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M4 3h16M4 21h16",
  /** Open column structure */
  columns: "M4 4h16M4 20h16M8 4v16M16 4v16M12 9v6",
  /** Premium amenities */
  sparkle:
    "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z",
  check: "M20 6 9 17l-5-5",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  chevronDown: "M6 9l6 6 6-6",
  phone:
    "M15.5 21A13.5 13.5 0 0 1 3 8.5 3 3 0 0 1 6 5.5h1.5a1 1 0 0 1 1 .9l.5 3a1 1 0 0 1-.5 1L7 11.5a11 11 0 0 0 5.5 5.5l1.1-1.5a1 1 0 0 1 1-.4l3 .5a1 1 0 0 1 .9 1V18a3 3 0 0 1-3 3Z",
  mail: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 .5 9 6 9-6",
  pin: "M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  shield: "M12 21s7-3.2 7-9V6l-7-3-7 3v6c0 5.8 7 9 7 9Z M9.5 12l1.8 1.8 3.5-3.6",
  building:
    "M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M14 21V10h4a2 2 0 0 1 2 2v9M3 21h18M7.5 8h2M7.5 12h2M7.5 16h2M17 14h.5M17 17.5h.5",
  store:
    "M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9ZM3 9l1.6-4.4A1 1 0 0 1 5.5 4h13a1 1 0 0 1 .9.6L21 9M3 9h18M9.5 21v-6h5v6",
  train:
    "M7 3h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM5 9h14M9 20l-2 2M15 20l2 2M9 12.5h.01M15 12.5h.01",
  plane: "M10.5 20.5 12 15l7 4v-2.5l-6-5V5a1.5 1.5 0 0 0-3 0v6.5l-6 5V19l7-4 1.5 5.5",
  car: "M5 17h14M6.5 17v2h-2v-2M19.5 17v2h-2v-2M4 13l1.6-4.8A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.2L20 13v4H4v-4ZM4 13h16M7.5 15h1M15.5 15h1",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
  users:
    "M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1.5a4 4 0 0 0-3-3.9M16.5 3.8a4 4 0 0 1 0 7.4",
  whatsapp:
    "M12.04 3a8.96 8.96 0 0 0-7.6 13.72L3.2 21l4.4-1.18A8.96 8.96 0 1 0 12.04 3Zm4.7 12.44c-.2.56-1.18 1.1-1.63 1.14-.44.04-.85.2-2.86-.6-2.4-.95-3.92-3.4-4.04-3.56-.12-.16-.97-1.3-.97-2.47s.61-1.75.83-1.99a.87.87 0 0 1 .63-.29c.16 0 .32 0 .46.01.15.01.35-.06.54.41.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.61 1.01 1.31 1.63.9.8 1.66 1.05 1.9 1.17.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.14Z",
} as const;

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  /** Renders a solid glyph instead of a stroked one (used for WhatsApp/star). */
  filled?: boolean;
}

export function Icon({ name, filled, ...props }: IconProps) {
  const solid = filled ?? name === "whatsapp";

  return (
    <svg
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
