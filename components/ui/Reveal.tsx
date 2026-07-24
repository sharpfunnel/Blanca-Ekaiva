"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

/**
 * Fires once when the element scrolls into view.
 *
 * The reference template reveals content on entry and never re-hides it, so
 * the observer disconnects after the first intersection.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "0px 0px -12% 0px"
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Reduced motion is handled entirely in CSS — globals.css forces the
    // revealed state — so the only fallback needed here is for browsers
    // without IntersectionObserver, where content must never stay hidden.
    // Deferred to the next frame so this is not a synchronous effect setState.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/** Fade-and-rise wrapper matching the template's default entry transition. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      data-revealed={inView}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
