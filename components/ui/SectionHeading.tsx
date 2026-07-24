import { Reveal } from "./Reveal";
import { SplitHeading } from "./SplitHeading";

interface SectionLabelProps {
  children: React.ReactNode;
  /** Use on dark backgrounds. */
  onDark?: boolean;
  className?: string;
}

/** Small eyebrow pill that sits above every section heading in the template. */
export function SectionLabel({
  children,
  onDark = false,
  className = "",
}: SectionLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-[0.12em] uppercase sm:px-4 sm:text-xs sm:tracking-[0.14em] ${
        onDark
          ? "border-white/15 bg-white/5 text-white/70"
          : "border-line bg-surface text-muted"
      } ${className}`}
    >
      <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
      {children}
    </span>
  );
}

interface SectionHeadingProps {
  label: string;
  /** Wrap words in *asterisks* to render them in gold. */
  heading: string;
  intro?: string;
  onDark?: boolean;
  /** Centre the block instead of left-aligning it. */
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Eyebrow + split-word heading + intro paragraph — the header block used at
 * the top of every content section.
 */
export function SectionHeading({
  label,
  heading,
  intro,
  onDark = false,
  align = "left",
  as = "h2",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={`flex flex-col ${
        centered ? "items-center text-center" : "items-start"
      } ${className}`}
    >
      <Reveal>
        <SectionLabel onDark={onDark}>{label}</SectionLabel>
      </Reveal>

      {/* Utilities outrank the base-layer heading colour, so no `!` is needed.
          36px section headings run to four or five lines at 390px, so phones
          get a step down the scale. */}
      <SplitHeading
        as={as}
        text={heading}
        delay={80}
        className={`mt-4 max-w-4xl text-[1.75rem] sm:mt-5 sm:text-6xl lg:text-7xl ${
          onDark ? "text-white" : ""
        }`}
      />

      {intro ? (
        <Reveal delay={220}>
          <p
            className={`mt-4 max-w-2xl text-base sm:mt-5 sm:text-lg ${
              onDark ? "text-white/70" : "text-body"
            }`}
          >
            {intro}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
