"use client";

import { useState } from "react";

import {
  COUNTRY_CENTROIDS,
  COUNTRY_PATHS,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/lib/admin/worldMapPaths";
import { formatNumber } from "@/lib/admin/format";

export interface CountryValue {
  /** ISO 3166-1 alpha-2. */
  code: string;
  label: string;
  value: number;
}

/**
 * Visitors by country on real Natural Earth borders.
 *
 * Countries are shaded by visitor share and marked with a proportional dot.
 * Both the borders and the dot positions come from lib/admin/worldMapPaths.ts,
 * projected offline through one geoEquirectangular instance — which is why a
 * dot always lands inside its own country instead of near it.
 */
export function WorldMap({ data }: { data: CountryValue[] }) {
  const [hover, setHover] = useState<CountryValue | null>(null);

  const byCode = new Map(data.map((d) => [d.code.toUpperCase(), d]));
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Visitors by country"
      >
        <g>
          {COUNTRY_PATHS.map((country) => {
            const entry = country.code ? byCode.get(country.code) : undefined;
            const intensity = entry ? entry.value / max : 0;
            return (
              <path
                key={`${country.code}-${country.name}`}
                d={country.d}
                fill={
                  entry
                    ? // Ramp from a barely-there tint to the full accent, so a
                      // country with one visitor still reads as "some".
                      `rgba(197,160,89,${0.18 + intensity * 0.62})`
                    : "rgba(255,255,255,0.05)"
                }
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={0.5}
                onMouseEnter={() =>
                  setHover(
                    entry ?? { code: country.code, label: country.name, value: 0 }
                  )
                }
                onMouseLeave={() => setHover(null)}
                className="transition-[fill] duration-200"
              />
            );
          })}
        </g>

        {/* Proportional markers — area, not radius, tracks the count. */}
        <g>
          {data.map((d) => {
            const centroid = COUNTRY_CENTROIDS[d.code.toUpperCase()];
            if (!centroid) return null;
            const r = 2 + Math.sqrt(d.value / max) * 9;
            return (
              <circle
                key={d.code}
                cx={centroid[0]}
                cy={centroid[1]}
                r={r}
                fill="rgba(197,160,89,0.75)"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={0.7}
                onMouseEnter={() => setHover(d)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>
      </svg>

      {hover ? (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-admin-border bg-admin-card-2 px-2.5 py-1.5 text-xs shadow-xl">
          <span className="text-admin-fg">{hover.label}</span>
          <span className="ml-2 tabular-nums text-admin-muted">
            {formatNumber(hover.value)} visitor{hover.value === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
