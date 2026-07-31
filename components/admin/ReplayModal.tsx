"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  X,
  Play,
  Pause,
  MousePointer2,
  Monitor,
  MapPin,
  Clock,
} from "lucide-react";
import type { SessionRow } from "@/lib/admin/types";
import { formatDuration } from "@/lib/admin/format";

/**
 * Session replay surface. The player chrome, cursor track, clicks and scrubber
 * are wired now; once rrweb events are captured to the DB, the recorded stream
 * mounts into the same frame (rrweb-player) in place of the demo cursor path.
 */
export function ReplayModal({
  session,
  onClose,
}: {
  session: SessionRow | null;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: 30, y: 24 });
  const [clickAt, setClickAt] = useState<{ x: number; y: number } | null>(null);
  const raf = useRef<number | undefined>(undefined);

  // Demo cursor path — replaced by the recorded rrweb track once live.
  useEffect(() => {
    if (!session || !playing) return;
    let t = progress;
    const tick = () => {
      t = (t + 0.0025) % 1;
      setProgress(t);
      setCursor({
        x: 20 + 60 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4)),
        y: 15 + 70 * t,
      });
      if (Math.random() < 0.01) {
        setClickAt({ x: 20 + Math.random() * 60, y: 15 + Math.random() * 70 });
        setTimeout(() => setClickAt(null), 500);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, playing]);

  const elapsed = session ? session.durationMs * progress : 0;

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
            className="fixed inset-0 z-50 m-auto flex h-fit max-h-[90vh] w-[min(920px,94vw)] flex-col overflow-hidden rounded-2xl border border-admin-border bg-admin-panel"
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

            {/* Replay stage */}
            <div className="relative aspect-video overflow-hidden bg-[#0a0a0a]">
              {/* Mock page skeleton (stands in for the recorded DOM) */}
              <div className="absolute inset-0 p-6 opacity-40">
                <div className="mx-auto h-full max-w-md space-y-3">
                  <div className="h-10 rounded-lg bg-admin-hover" />
                  <div className="h-28 rounded-lg bg-admin-hover" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-lg bg-admin-hover" />
                    <div className="h-20 rounded-lg bg-admin-hover" />
                  </div>
                  <div className="h-14 rounded-lg bg-admin-hover" />
                </div>
              </div>

              {/* Cursor */}
              <motion.div
                className="absolute z-10"
                style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                animate={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                transition={{ ease: "linear", duration: 0.05 }}
              >
                <MousePointer2 className="size-5 fill-white text-black drop-shadow" />
              </motion.div>

              {/* Click ripple */}
              <AnimatePresence>
                {clickAt ? (
                  <motion.span
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute z-10 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-admin-accent"
                    style={{ left: `${clickAt.x}%`, top: `${clickAt.y}%` }}
                  />
                ) : null}
              </AnimatePresence>

              <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/70">
                DEMO PLAYBACK · live rrweb capture wires in here
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 border-t border-admin-border px-5 py-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex size-9 items-center justify-center rounded-full bg-admin-accent text-black transition-colors hover:bg-admin-accent-2"
              >
                {playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
              <span className="w-10 text-[11px] tabular-nums text-admin-muted">
                {formatDuration(elapsed)}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-admin-card-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-admin-accent"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-[11px] tabular-nums text-admin-muted">
                {formatDuration(session.durationMs)}
              </span>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
