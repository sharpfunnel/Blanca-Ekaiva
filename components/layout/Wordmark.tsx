/**
 * Typographic wordmark.
 *
 * The brief lists high-resolution Blanca / Ekaiva logo files as still pending
 * from the client, and the only artwork available on the reference site is a
 * low-resolution crop. This renders the identity in the page's own type so it
 * stays crisp at every size — swap in the supplied SVG when it arrives.
 */
export function Wordmark({
  onDark = true,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span
        className={`font-display text-xl font-semibold tracking-[0.22em] sm:text-2xl ${
          onDark ? "text-white" : "text-ink"
        }`}
      >
        BLANCA
      </span>
      <span
        className={`mt-1 text-[10px] tracking-[0.18em] uppercase sm:text-[11px] ${
          onDark ? "text-white/55" : "text-muted"
        }`}
      >
        Quintessential Luxury
      </span>
    </span>
  );
}
