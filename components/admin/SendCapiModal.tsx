"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Send,
  X,
  Check,
  Copy,
  Loader2,
  MapPin,
  Tag,
  CircleAlert,
  TriangleAlert,
} from "lucide-react";
import {
  CAPI_CURRENCIES,
  CAPI_EVENT_TYPES,
  CUSTOM_EVENT_NAME_PATTERN,
} from "@/lib/meta/constants";
import type { Lead } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/admin/format";

/** The row cell: a status badge + a "Send" button that opens the modal. */
export function SendCapiCell({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [sentAt, setSentAt] = useState(lead.metaCapiSentAt);
  const [error, setError] = useState(lead.metaCapiError);

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {error ? (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300"
          title={error}
        >
          <CircleAlert className="size-3" /> Failed
        </span>
      ) : sentAt ? (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
          title={`Sent ${timeAgo(sentAt)}`}
        >
          <Check className="size-3" /> Sent
        </span>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-admin-border bg-admin-card px-2 py-1 text-[11px] font-medium text-admin-fg-2 transition-colors hover:text-admin-fg"
      >
        <Send className="size-3" /> Send
      </button>

      <SendCapiModal
        lead={lead}
        open={open}
        onClose={() => setOpen(false)}
        onSent={(id) => {
          setSentAt(new Date().toISOString());
          setError(null);
          void id;
        }}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}

function SendCapiModal({
  lead,
  open,
  onClose,
  onSent,
  onError,
}: {
  lead: Lead;
  open: boolean;
  onClose: () => void;
  onSent: (eventId: string) => void;
  onError: (msg: string) => void;
}) {
  const [eventType, setEventType] = useState<string>("Lead");
  const [customName, setCustomName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [orderId, setOrderId] = useState("");
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<{
    payload: unknown;
    warnings: string[];
  } | null>(null);
  const [state, setState] = useState<
    | { s: "idle" }
    | { s: "sending" }
    | {
        s: "done";
        eventId?: string;
        preview?: boolean;
        fbTraceId?: string;
        eventsReceived?: number;
      }
    | { s: "error"; message: string }
  >({ s: "idle" });

  const eventName = eventType === "Custom" ? customName.trim() : eventType;
  const nameValid =
    eventType !== "Custom" || CUSTOM_EVENT_NAME_PATTERN.test(eventName);

  /**
   * The preview comes from the server, built by the same function that builds
   * the live send — a preview assembled here in the browser could drift from
   * what is actually POSTed, and would have to guess at data (IP, _fbc, hashed
   * fields) the client is not allowed to see.
   */
  useEffect(() => {
    if (!open || !eventName || !nameValid || state.s === "done") return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch("/api/admin/leads/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "preview",
          leadId: lead.id,
          eventName,
          value: value ? Number(value) : undefined,
          currency: value ? currency : undefined,
          orderId: orderId.trim() || undefined,
        }),
      })
        .then((r) => r.json())
        .then((d: { ok: boolean; payload?: unknown; warnings?: string[] }) => {
          if (d.ok)
            setPreview({ payload: d.payload, warnings: d.warnings ?? [] });
        })
        .catch(() => {
          /* preview is advisory; a failure must not block the send */
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, lead.id, eventName, nameValid, value, currency, orderId, state.s]);

  async function send() {
    if (!eventName || !nameValid) return;
    setState({ s: "sending" });
    try {
      const res = await fetch("/api/admin/leads/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          leadId: lead.id,
          eventName,
          value: value ? Number(value) : undefined,
          currency: value ? currency : undefined,
          orderId: orderId.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        eventId?: string;
        preview?: boolean;
        fbTraceId?: string;
        eventsReceived?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        const msg = data.error || `Request failed (${res.status})`;
        setState({ s: "error", message: msg });
        onError(msg);
        return;
      }
      setState({
        s: "done",
        eventId: data.eventId,
        preview: data.preview,
        fbTraceId: data.fbTraceId,
        eventsReceived: data.eventsReceived,
      });
      if (!data.preview) onSent(data.eventId || "");
    } catch (e) {
      const msg = (e as Error).message;
      setState({ s: "error", message: msg });
      onError(msg);
    }
  }

  const field =
    "w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-fg outline-none transition-colors placeholder:text-admin-muted focus:border-admin-accent";

  return (
    <AnimatePresence>
      {open ? (
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
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 m-auto flex h-fit max-h-[92vh] w-[min(560px,94vw)] flex-col overflow-hidden rounded-2xl border border-admin-border bg-admin-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-admin-border px-5 py-3">
              <div>
                <p className="font-display text-sm font-semibold text-admin-fg">
                  Send Meta Conversion · {lead.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-admin-muted">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {lead.city}, {lead.country}
                  </span>
                  {lead.metaAdId ? (
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" /> ad {lead.metaAdId}
                    </span>
                  ) : null}
                  {lead.placement ? (
                    <span className="flex items-center gap-1">
                      <Tag className="size-3" /> {lead.placement}
                    </span>
                  ) : null}
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

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {state.s === "done" ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                    <Check className="size-6" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-admin-fg">
                    {state.preview ? "Preview send successful" : "Event sent to Meta"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-admin-muted">
                    {state.preview
                      ? "No Meta credentials configured — this was a local preview only and did not reach Meta."
                      : "Meta received the conversion event."}
                  </p>
                  {/* fbtrace_id + events_received are what make a delivery
                      findable in Events Manager — surface both. */}
                  <div className="mt-3 flex flex-col items-center gap-1.5">
                    {state.eventId ? (
                      <code className="rounded-lg border border-admin-border bg-admin-card px-2.5 py-1 text-[11px] text-admin-fg-2">
                        event_id: {state.eventId}
                      </code>
                    ) : null}
                    {typeof state.eventsReceived === "number" ? (
                      <code className="rounded-lg border border-admin-border bg-admin-card px-2.5 py-1 text-[11px] text-admin-fg-2">
                        events_received: {state.eventsReceived}
                      </code>
                    ) : null}
                    {state.fbTraceId ? (
                      <code className="rounded-lg border border-admin-border bg-admin-card px-2.5 py-1 text-[11px] text-admin-fg-2">
                        fbtrace_id: {state.fbTraceId}
                      </code>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-black hover:bg-admin-accent-2"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Event type */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                      Event
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CAPI_EVENT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setEventType(t.value)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                            eventType === t.value
                              ? "border-admin-accent bg-admin-accent/15 text-admin-fg"
                              : "border-admin-border bg-admin-card text-admin-muted hover:text-admin-fg-2"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {eventType === "Custom" ? (
                      <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Custom event name"
                        className={cn(field, "mt-2")}
                      />
                    ) : null}
                  </div>

                  {/* Value + currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                        Value (optional)
                      </label>
                      <input
                        value={value}
                        onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
                        inputMode="decimal"
                        placeholder="0"
                        className={field}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={cn(field, "cursor-pointer")}
                      >
                        {CAPI_CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Order / reference id */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                      Order / reference ID (optional — used as event_id for dedup)
                    </label>
                    <input
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Leave blank to use the lead ID"
                      className={field}
                    />
                  </div>

                  {/* Warnings — none of these block the send; Meta accepts most
                      of them and quietly matches nothing. */}
                  {preview?.warnings.length ? (
                    <ul className="space-y-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                      {preview.warnings.map((w) => (
                        <li
                          key={w}
                          className="flex items-start gap-1.5 text-[11px] text-amber-200"
                        >
                          <TriangleAlert className="mt-px size-3 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Payload preview — the exact JSON the server will POST,
                      built by the same function, with the token redacted. */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-admin-fg-2">
                        Payload preview
                      </label>
                      <button
                        type="button"
                        disabled={!preview}
                        onClick={() => {
                          navigator.clipboard
                            ?.writeText(JSON.stringify(preview?.payload, null, 2))
                            .then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1200);
                            });
                        }}
                        className="flex items-center gap-1 text-[11px] text-admin-muted hover:text-admin-fg disabled:opacity-40"
                      >
                        {copied ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <pre className="max-h-44 overflow-auto rounded-lg border border-admin-border bg-admin-bg p-3 text-[11px] leading-relaxed text-admin-fg-2">
                      {preview
                        ? JSON.stringify(preview.payload, null, 2)
                        : nameValid && eventName
                          ? "Building preview…"
                          : "Enter a valid event name (letters, numbers, underscores)."}
                    </pre>
                    <p className="mt-1.5 text-[11px] text-admin-muted">
                      Email, phone, name and location are SHA-256 hashed on the
                      server before sending — never sent in plain text. The access
                      token is never exposed to this page.
                    </p>
                  </div>

                  {state.s === "error" ? (
                    <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {state.message}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Footer */}
            {state.s !== "done" ? (
              <div className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-admin-border px-4 py-2 text-sm text-admin-fg-2 hover:text-admin-fg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={!eventName || !nameValid || state.s === "sending"}
                  className="flex items-center gap-2 rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-admin-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.s === "sending" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send event
                </button>
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
