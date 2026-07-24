"use client";

import { Fragment, type ElementType } from "react";
import { useInView } from "./Reveal";

interface SplitHeadingProps {
  /**
   * Heading copy. Wrap any run of words in asterisks to render it in the gold
   * accent colour, e.g. `"The Address for *Business*"`.
   */
  text: string;
  as?: ElementType;
  className?: string;
  /** Milliseconds between each word. */
  stagger?: number;
  /** Delay before the first word animates. */
  delay?: number;
}

/**
 * Per-word heading reveal.
 *
 * The reference template splits every section heading into individual words
 * that rise and fade in sequence. Each word is its own inline-block so the
 * transform never affects line wrapping.
 */
export function SplitHeading({
  text,
  as: Tag = "h2",
  className = "",
  stagger = 55,
  delay = 0,
}: SplitHeadingProps) {
  const { ref, inView } = useInView<HTMLHeadingElement>();

  // Split on the accent markers first, then into words, keeping track of which
  // segment each word came from so accented runs stay gold.
  const words = text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .flatMap((segment) => {
      const accent = segment.startsWith("*") && segment.endsWith("*");
      const clean = accent ? segment.slice(1, -1) : segment;
      return clean
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, accent }));
    });

  return (
    <Tag ref={ref} className={className}>
      {words.map(({ word, accent }, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className={`word ${accent ? "text-gold" : ""}`}
            data-revealed={inView}
            style={
              {
                "--word-delay": `${delay + i * stagger}ms`,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
          {/* The space sits *between* the inline-blocks so lines still wrap. */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
