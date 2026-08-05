"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Icon } from "./Icons";
import { interestOptions } from "@/lib/content";

declare global {
  interface Window {
    /** Meta Pixel, injected in app/layout.tsx once the client supplies an ID. */
    fbq?: (...args: unknown[]) => void;
  }
}

/** Optional external webhook (Google Sheet / Zapier / CRM), fire-and-forget. */
const LEAD_WEBHOOK = process.env.NEXT_PUBLIC_LEAD_WEBHOOK;

type Variant = "compact" | "full";

interface LeadFormProps {
  /** `compact` stacks every field; `full` puts name + phone on one row. */
  variant?: Variant;
  onDark?: boolean;
  className?: string;
  submitLabel?: string;
}

interface Errors {
  name?: string;
  phone?: string;
}

/**
 * Short landing-page lead form — Name + Phone + Interest only. On submit it
 * creates the lead and redirects to /thank-you?leadId=…, where the visitor can
 * optionally add budget, email and a message to the SAME lead. A 3-field form
 * converts better; the optional details are deferred, not lost.
 */
export function LeadForm({
  variant = "compact",
  onDark = false,
  className = "",
  submitLabel,
}: LeadFormProps) {
  const router = useRouter();
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<string>(interestOptions[0]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isFull = variant === "full";

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Please enter your full name.";
    // Indian mobile numbers: 10 digits beginning 6-9, ignoring +91 / 0 prefixes.
    const digits = phone.replace(/\D/g, "").replace(/^(91|0)/, "");
    if (!/^[6-9]\d{9}$/.test(digits))
      next.phone = "Enter a valid 10-digit mobile number.";
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Honeypot — bots fill hidden fields, humans never do.
    const form = event.currentTarget;
    if ((form.elements.namedItem("company") as HTMLInputElement)?.value) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const t = window.__blancaTrack;

    try {
      const res = await fetch("/api/track/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          interest,
          sessionId: t?.sessionId,
          visitorId: t?.visitorId,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; leadId?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Submission failed. Please try again.");
      }

      const leadId = data.leadId;

      // Meta Pixel Lead event. eventID = leadId lets a server-side Conversions
      // API call with the same event_id dedup against this browser event.
      window.fbq?.(
        "track",
        "Lead",
        { content_name: "Blanca Ekaiva Landing Page", content_category: interest },
        leadId ? { eventID: leadId } : undefined
      );

      if (LEAD_WEBHOOK) {
        void fetch(LEAD_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
            interest,
            leadId,
            project: "Blanca Ekaiva — Turbhe",
          }),
          keepalive: true,
        }).catch(() => {});
      }

      form.reset();
      router.push(
        leadId ? `/thank-you?leadId=${encodeURIComponent(leadId)}` : "/thank-you"
      );
    } catch (err) {
      setSubmitError(
        (err as Error).message || "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  /* ── Field styling ────────────────────────────────────────────────────── */
  const fieldBase =
    "w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors duration-200 " +
    (onDark
      ? "border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-gold"
      : "border-line bg-white text-ink placeholder:text-muted focus:border-gold");

  const labelBase = `mb-1.5 block text-sm font-medium ${
    onDark ? "text-white/80" : "text-ink-3"
  }`;

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      {/* Honeypot: visually hidden, ignored by humans and screen readers. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-0 opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className={isFull ? "" : "sm:col-span-2"}>
          <label htmlFor={`${uid}-name`} className={labelBase}>
            Full Name
          </label>
          <input
            id={`${uid}-name`}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={fieldBase}
          />
          {errors.name ? (
            <p id={`${uid}-name-error`} className="mt-1.5 text-sm text-red-500">
              {errors.name}
            </p>
          ) : null}
        </div>

        {/* Phone */}
        <div className={isFull ? "" : "sm:col-span-2"}>
          <label htmlFor={`${uid}-phone`} className={labelBase}>
            Phone Number
          </label>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
            className={fieldBase}
          />
          {errors.phone ? (
            <p id={`${uid}-phone-error`} className="mt-1.5 text-sm text-red-500">
              {errors.phone}
            </p>
          ) : null}
        </div>

        {/* Interest — a single tap, kept on-page as a key qualifier */}
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-interest`} className={labelBase}>
            Interested In
          </label>
          <select
            id={`${uid}-interest`}
            name="interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className={`${fieldBase} cursor-pointer`}
          >
            {interestOptions.map((option) => (
              <option key={option} value={option} className="bg-white text-ink">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {submitError ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="mt-5 w-full"
        disabled={submitting}
      >
        {submitting
          ? "Submitting…"
          : (submitLabel ?? (isFull ? "Get Details" : "Get Price & Floor Plan"))}
        {!submitting ? <Icon name="arrowRight" className="size-5" /> : null}
      </Button>

      <p
        className={`mt-3 flex items-center justify-center gap-1.5 text-center text-sm ${
          onDark ? "text-white/55" : "text-muted"
        }`}
      >
        <Icon name="shield" className="size-4 shrink-0" />
        100% free &amp; confidential — we call back within 30 minutes.
      </p>
    </form>
  );
}
