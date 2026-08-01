"use client";

import "rrweb-player/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Monitor, MapPin, Clock, Film, Loader2 } from "lucide-react";
import type { SessionRow } from "@/lib/admin/types";
import { getReplay } from "@/lib/admin/api";
import { formatDuration } from "@/lib/admin/format";

/**
 * Real session replay. Fetches the session's recorded rrweb event stream and
 * plays it back with rrweb-player (its own DOM reconstruction + controls), so
 * you see exactly what the visitor saw and did — mouse moves, clicks, scrolls,
 * navigation. Recordings need ≥ 2 events (a full snapshot plus one update);
 * very short visits that never flushed show an honest empty state.
 */
export function ReplayModal({
  session,
  onClose,
}: {
  session: SessionRow | null;
  onClose: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const [mountError, setMountError] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "replay", session?.id],
    queryFn: () => getReplay(session!.id),
    enabled: Boolean(session),
  });

  const events = data?.events ?? [];
  const hasRecording = events.length >= 2;

  // Mount / tear down the player whenever the recording changes.
  useEffect(() => {
    if (!session || !hasRecording || !holder.current) return;
    let destroyed = false;

    (async () => {
      try {
        const { default: rrwebPlayer } = await import("rrweb-player");
        if (destroyed || !holder.current) return;
        holder.current.innerHTML = "";
        const width = Math.max(320, holder.current.clientWidth || 880);
        const height = Math.round(width * 0.58);
        playerRef.current = new rrwebPlayer({
          target: holder.current,
          props: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            events: events as any[],
            width,
            height,
            autoPlay: true,
            showController: true,
            speedOption: [1, 2, 4, 8],
          },
        });
      } catch {
        setMountError(true);
      }
    })();

    return () => {
      destroyed = true;
      try {
        playerRef.current?.$destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      if (holder.current) holder.current.innerHTML = "";
    };
  }, [session, hasRecording, events]);

  return (
    <AnimatePresence>
      {session ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-50 m-auto flex h-fit max-h-[92vh] w-[min(960px,95vw)] flex-col overflow-hidden rounded-2xl border border-admin-border bg-admin-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-admin-border px-5 py-3">
              <div>
                <p className="font-display text-sm font-semibold text-admin-fg">
                  Session Replay · {session.id}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-admin-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {session.city}, {session.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="size-3" /> {session.device} · {session.browser}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" /> {formatDuration(session.durationMs)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:text-admin-fg"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Player stage */}
            <div className="relative flex min-h-[320px] items-center justify-center bg-[#0a0a0a] p-3">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-admin-muted">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-xs">Loading recording…</p>
                </div>
              ) : isError || mountError ? (
                <EmptyReplay
                  title="Could not load this recording"
                  hint="The event stream may be incomplete. Try another session."
                />
              ) : !hasRecording ? (
                <EmptyReplay
                  title="No recording for this session"
                  hint="Very short visits (a quick bounce, or a tab closed before the first save) don't produce a replay. Sessions with real activity will play here."
                />
              ) : null}

              {/* rrweb-player mounts here (kept in DOM so the ref is stable) */}
              <div
                ref={holder}
                className="rrweb-holder w-full"
                style={{ display: hasRecording && !mountError ? "block" : "none" }}
              />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function EmptyReplay({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl border border-admin-border bg-admin-card-2 text-admin-muted">
        <Film className="size-5" />
      </span>
      <p className="text-sm font-medium text-admin-fg">{title}</p>
      <p className="text-xs text-admin-muted">{hint}</p>
    </div>
  );
}
