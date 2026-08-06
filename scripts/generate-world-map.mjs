/**
 * One-off generator for lib/admin/worldMapPaths.ts.
 * Run with: node scripts/generate-world-map.mjs   (after `npm i --no-save world-atlas d3-geo topojson-client`)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import isoCountries from "i18n-iso-countries";

const WIDTH = 960;
const HEIGHT = 480;

const topo = JSON.parse(
  readFileSync("node_modules/world-atlas/countries-110m.json", "utf8")
);
const countries = feature(topo, topo.objects.countries);

// Antarctica is a third of the projected area and never has visitors in it.
const features = countries.features.filter((f) => f.properties.name !== "Antarctica");

const projection = geoEquirectangular().fitExtent(
  [
    [0, 0],
    [WIDTH, HEIGHT],
  ],
  { type: "FeatureCollection", features }
);
const path = geoPath(projection);

const rows = [];
const centroids = [];
for (const f of features) {
  const d = path(f);
  if (!d) continue;
  // topojson ids are ISO 3166-1 *numeric*; the app stores alpha-2 (that is what
  // the edge geo headers give us), so translate here rather than at runtime.
  const code = isoCountries.numericToAlpha2(String(f.id).padStart(3, "0")) || "";
  rows.push({ name: f.properties.name, code, d: d.replace(/(\.\d\d)\d+/g, "$1") });

  const [cx, cy] = path.centroid(f);
  if (code && Number.isFinite(cx) && Number.isFinite(cy)) {
    centroids.push({ code, cx: +cx.toFixed(1), cy: +cy.toFixed(1) });
  }
}

// The exact projection parameters, so runtime marker placement can reproduce
// this projection without shipping d3-geo.
const [tx, ty] = projection.translate();
const scale = projection.scale();

const out = `// GENERATED FILE — do not edit by hand.
//
// Country borders for the admin world map. Produced offline from the
// public-domain Natural Earth 110m dataset (via the \`world-atlas\` package),
// projected with d3-geo's geoEquirectangular().fitExtent(), and emitted as
// plain SVG path data. d3-geo, topojson-client and world-atlas are installed
// with \`npm install --no-save\` for the generation run and removed straight
// after, so the shipped app carries no map library at all.
//
// Regenerate with: node scripts/generate-world-map.mjs
//
// Antarctica is excluded: it is a third of the projected area and never has a
// visitor in it.

export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${HEIGHT};

/** The projection d3-geo produced, so markers can be placed without it. */
export const MAP_PROJECTION = {
  scale: ${scale},
  translate: [${tx}, ${ty}] as [number, number],
};

export interface CountryPath {
  name: string;
  /** ISO 3166-1 alpha-2, or "" for the handful with no assigned code. */
  code: string;
  d: string;
}

export const COUNTRY_PATHS: CountryPath[] = ${JSON.stringify(rows, null, 0)};

/**
 * Projected centroid per country, in the SAME projection as the paths above —
 * so a marker always lands inside the country it represents, which is the whole
 * reason this is generated rather than hand-placed.
 */
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = ${JSON.stringify(
  Object.fromEntries(centroids.map((c) => [c.code, [c.cx, c.cy]])),
  null,
  0
)};
`;

writeFileSync("lib/admin/worldMapPaths.ts", out);
console.log(`wrote ${rows.length} countries, ${(out.length / 1024).toFixed(0)}KB`);
