"use client";

import { useId, useState } from "react";
import { Icon } from "./Icons";

interface Item {
  q: string;
  a: string;
}

/**
 * FAQ accordion.
 *
 * Height is animated with the `grid-template-rows: 0fr -> 1fr` technique so the
 * panel eases open to its natural height without measuring anything in JS.
 * One panel is open at a time, matching the reference template.
 */
export function Accordion({ items }: { items: readonly Item[] }) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;

        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`${uid}-panel-${i}`}
                id={`${uid}-trigger-${i}`}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left sm:gap-6 sm:py-6"
              >
                <span
                  className={`font-display text-lg leading-snug tracking-[-0.01em] transition-colors duration-300 sm:text-2xl ${
                    isOpen ? "text-gold-dark" : "text-ink group-hover:text-gold-dark"
                  }`}
                >
                  {item.q}
                </span>

                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:size-9 ${
                    isOpen
                      ? "rotate-180 border-gold bg-gold text-ink"
                      : "border-line text-ink-3 group-hover:border-gold group-hover:text-gold-dark"
                  }`}
                  aria-hidden="true"
                >
                  <Icon name="chevronDown" className="size-4" />
                </span>
              </button>
            </h3>

            <div
              id={`${uid}-panel-${i}`}
              role="region"
              aria-labelledby={`${uid}-trigger-${i}`}
              className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.44,0,0.16,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className={`max-w-3xl pb-6 text-base transition-opacity duration-300 sm:pr-14 sm:pb-7 sm:text-lg ${
                    isOpen ? "text-body opacity-100" : "opacity-0"
                  }`}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
