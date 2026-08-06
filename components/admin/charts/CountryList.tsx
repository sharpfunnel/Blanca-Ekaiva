"use client";

import { formatNumber } from "@/lib/admin/format";
import type { CountryValue } from "./WorldMap";

/**
 * Flag emoji from the ISO-2 code via Unicode regional indicators — no image
 * assets, no sprite sheet, no CDN. "IN" → 🇮🇳.
 */
export function flagEmoji(code: string) {
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export function CountryList({
  data,
  limit = 8,
}: {
  data: CountryValue[];
  limit?: number;
}) {
  const rows = data.slice(0, limit);
  const max = Math.max(1, ...rows.map((r) => r.value));

  if (!rows.length) {
    return (
      <p className="px-1 py-6 text-center text-xs text-admin-muted">
        No visitors located yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.code} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-base leading-none">
            {flagEmoji(row.code)}
          </span>
          <span className="w-28 shrink-0 truncate text-xs text-admin-fg-2">
            {row.label}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-card-2">
            <span
              className="block h-full rounded-full bg-admin-accent/80"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-admin-fg">
            {formatNumber(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
