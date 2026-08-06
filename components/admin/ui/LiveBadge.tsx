"use client";

import { useQuery } from "@tanstack/react-query";

import { getLiveCount, queryKeys } from "@/lib/admin/api";

/**
 * The one genuinely live widget in the panel.
 *
 * Renders the count the page already loaded, then polls for a fresher number
 * every 20s. `initialData` means it never flashes a zero or a spinner on mount,
 * and `refetchIntervalInBackground` is left off so a forgotten open tab stops
 * hitting the database.
 */
export function LiveBadge({ initial = 0 }: { initial?: number }) {
  const { data } = useQuery({
    queryKey: queryKeys.live(),
    queryFn: getLiveCount,
    refetchInterval: 20_000,
    initialData: { count: initial },
  });

  const count = data?.count ?? initial;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
      <span className="relative flex size-1.5">
        {count > 0 ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        ) : null}
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
      </span>
      {count} live now
    </span>
  );
}
