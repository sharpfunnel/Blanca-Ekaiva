import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Pill CTA.
 *
 * The reference template renders every call-to-action as a 50px-radius pill:
 * primary is a solid accent fill with near-white label, tertiary is a
 * transparent 2px accent outline. Both are reproduced here with the accent
 * re-mapped from the template's blue to the Blanca gold.
 */

type Variant = "primary" | "outline" | "dark" | "onDark";
type Size = "md" | "lg";

const base =
  "items-center justify-center gap-2 rounded-full font-medium " +
  "transition-all duration-300 ease-[cubic-bezier(0.44,0,0.16,1)] " +
  "active:scale-[0.98] whitespace-nowrap";

/**
 * An unprefixed display utility in the caller's `className` — `hidden`,
 * `block`, and friends. Tailwind emits `.inline-flex` *after* `.hidden` at
 * equal specificity, so a base `inline-flex` silently wins over a caller's
 * `hidden md:inline-flex` no matter what order the classes appear in. When the
 * caller states a display of their own, ours steps aside.
 *
 * Variant-prefixed utilities (`md:inline-flex`) are deliberately not matched:
 * those live in a media query and already win on their own, and dropping the
 * base would leave the button unstyled below the breakpoint.
 */
const OWN_DISPLAY =
  /(^|\s)(hidden|block|inline|inline-block|inline-flex|flex|grid|contents)(\s|$)/;

const variants: Record<Variant, string> = {
  // Gold fill with ink label — gold on white text would fail contrast.
  primary:
    "bg-gold text-ink hover:bg-gold-light hover:shadow-[0_10px_30px_-8px_rgba(197,160,89,0.65)]",
  outline:
    "border-2 border-gold text-gold-dark hover:bg-gold hover:text-ink hover:border-gold",
  dark: "bg-ink text-surface hover:bg-ink-3",
  // For placement on photography / dark sections
  onDark:
    "border-2 border-white/30 text-white backdrop-blur-sm hover:bg-white hover:text-ink hover:border-white",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-base sm:text-lg",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type LinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type NativeProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Button(props: LinkProps): React.JSX.Element;
export function Button(props: NativeProps): React.JSX.Element;
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: LinkProps | NativeProps) {
  const display = OWN_DISPLAY.test(className) ? "" : "inline-flex";
  const cls = `${display} ${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (typeof (rest as LinkProps).href === "string") {
    const { href, ...anchorProps } = rest as LinkProps;
    // External / protocol links open safely; in-page anchors stay in the tab.
    const external = /^(https?:|mailto:|tel:)/.test(href);

    return (
      <a
        href={href}
        className={cls}
        {...(external && href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={cls} {...(rest as NativeProps)}>
      {children}
    </button>
  );
}
