"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CircleAlert,
  Clock,
  Send,
  TriangleAlert,
  Loader2,
} from "lucide-react";

import { getMetaOverview, queryKeys } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { TableWrap, Td, Th, Tr } from "@/components/admin/ui/Table";
import { timeAgo } from "@/lib/admin/format";
import {
  CAPI_CURRENCIES,
  CAPI_EVENT_TYPES,
  CUSTOM_EVENT_NAME_PATTERN,
} from "@/lib/meta/constants";
import { cn } from "@/lib/utils";

/**
 * Conversions API composer and delivery log.
 *
 * The composer is dry-run by default: it shows the exact JSON the server would
 * POST — built by the same function that does the sending, with the access
 * token redacted — and only contacts Meta when the operator explicitly sends.
 */
export default function MetaCapiPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.capiLog(),
    queryFn: getMetaOverview,
  });

  const deliveries = data?.deliveries ?? [];
  /** "" means "no explicit pick yet" — the newest lead stands in. */
  const [pickedLeadId, setPickedLeadId] = useState("");
  const [eventType, setEventType] = useState("Lead");
  const [customName, setCustomName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [orderId, setOrderId] = useState("");
  const [preview, setPreview] = useState<{
    payload: unknown;
    warnings: string[];
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; eventId?: string; fbTraceId?: string; eventsReceived?: number; preview?: boolean }
    | { ok: false; error: string }
    | null
  >(null);

  // Derived, not stored in an effect: the composer defaults to the newest lead
  // the moment the log loads, without a second render pass.
  const leadId = pickedLeadId || deliveries[0]?.leadId || "";

  const eventName = eventType === "Custom" ? customName.trim() : eventType;
  const nameValid =
    eventType !== "Custom" || CUSTOM_EVENT_NAME_PATTERN.test(eventName);

  // Dry run: ask the server to build the payload, never to send it.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      // Cleared here rather than in the effect body: a synchronous setState in
      // an effect triggers a cascading render for no benefit.
      if (!leadId || !eventName || !nameValid) {
        setPreview(null);
        return;
      }
      void fetch("/api/admin/leads/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "preview",
          leadId,
          eventName,
          value: value ? Number(value) : undefined,
          currency: value ? currency : undefined,
          orderId: orderId.trim() || undefined,
        }),
      })
        .then((r) => r.json())
        .then((d: { ok: boolean; payload?: unknown; warnings?: string[] }) => {
          if (d.ok) setPreview({ payload: d.payload, warnings: d.warnings ?? [] });
        })
        .catch(() => {});
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [leadId, eventName, nameValid, value, currency, orderId]);

  async function send() {
    if (!leadId || !eventName || !nameValid) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/leads/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          leadId,
          eventName,
          value: value ? Number(value) : undefined,
          currency: value ? currency : undefined,
          orderId: orderId.trim() || undefined,
        }),
      });
      const d = await res.json();
      setResult(d.ok ? { ok: true, ...d } : { ok: false, error: d.error || "Send failed." });
      void refetch();
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  const field =
    "w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-fg outline-none transition-colors focus:border-admin-accent";

  const sent = deliveries.filter((d) => d.sentAt).length;
  const failed = deliveries.filter((d) => d.error).length;

  return (
    <div>
      <PageHeader
        title="Meta CAPI"
        subtitle="Server-side conversion payloads: compose, inspect, and see what was delivered"
      />

      <div className="grid gap-3 lg:grid-cols-[420px_1fr]">
        {/* ── Composer ─────────────────────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader
            title="Payload composer"
            subtitle="Builds the exact JSON the server would POST. Nothing leaves this server until you press Send."
          />
          <div className="space-y-3 px-5 pb-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                Lead
              </label>
              <select
                value={leadId}
                onChange={(e) => setPickedLeadId(e.target.value)}
                className={cn(field, "cursor-pointer")}
              >
                {deliveries.map((d) => (
                  <option key={d.leadId} value={d.leadId}>
                    {d.name} · {d.phone} · {new Date(d.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                  Value
                </label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
                  inputMode="decimal"
                  placeholder="optional"
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

            <div>
              <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                Order / reference ID (becomes event_id)
              </label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Leave blank to use the lead ID"
                className={field}
              />
            </div>

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

            <div>
              <label className="mb-1.5 block text-xs font-medium text-admin-fg-2">
                Payload (dry run)
              </label>
              <pre className="max-h-72 overflow-auto rounded-lg border border-admin-border bg-admin-bg p-3 text-[11px] leading-relaxed text-admin-fg-2">
                {preview
                  ? JSON.stringify(preview.payload, null, 2)
                  : deliveries.length
                    ? "Building preview…"
                    : "No leads to compose from yet."}
              </pre>
            </div>

            {result ? (
              result.ok ? (
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {result.preview
                    ? "Preview send — no Meta credentials configured, nothing was transmitted."
                    : "Meta accepted the event."}
                  <div className="mt-1 space-y-0.5 font-mono text-[10px] text-emerald-200/80">
                    {result.eventId ? <div>event_id: {result.eventId}</div> : null}
                    {typeof result.eventsReceived === "number" ? (
                      <div>events_received: {result.eventsReceived}</div>
                    ) : null}
                    {result.fbTraceId ? <div>fbtrace_id: {result.fbTraceId}</div> : null}
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {result.error}
                </p>
              )
            ) : null}

            <button
              type="button"
              onClick={send}
              disabled={!leadId || !eventName || !nameValid || sending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-admin-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send to Meta
            </button>
          </div>
        </Card>

        {/* ── Delivery log ─────────────────────────────────────────────── */}
        <Card className="h-fit">
          <CardHeader
            title="Delivery log"
            subtitle={`${sent} sent · ${failed} failed · ${deliveries.length - sent - failed} not sent`}
          />
          {isLoading ? (
            <div className="p-5">
              <Skeleton className="h-72 w-full" />
            </div>
          ) : !deliveries.length ? (
            <EmptyState
              icon={Send}
              title="No leads yet"
              description="Every new lead fires a server-side conversion automatically; the outcome shows up here."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Created</Th>
                  <Th>Status</Th>
                  <Th>event_id</Th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <Tr key={d.leadId}>
                    <Td className="text-admin-fg">
                      {d.name}
                      <span className="ml-2 text-admin-muted">{d.phone}</span>
                    </Td>
                    <Td className="text-admin-muted">{timeAgo(d.createdAt)}</Td>
                    <Td>
                      {d.error ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300"
                          title={d.error}
                        >
                          <CircleAlert className="size-3" /> Failed
                        </span>
                      ) : d.sentAt ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                          title={`Sent ${timeAgo(d.sentAt)}`}
                        >
                          <Check className="size-3" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-admin-border bg-admin-card-2 px-2 py-0.5 text-[11px] text-admin-muted">
                          <Clock className="size-3" /> Not sent
                        </span>
                      )}
                    </Td>
                    <Td className="max-w-[180px] truncate font-mono text-[11px] text-admin-muted">
                      {d.eventId || "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
}
