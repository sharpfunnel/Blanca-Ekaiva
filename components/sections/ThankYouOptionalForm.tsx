"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { budgetOptions } from "@/lib/content";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Optional follow-up on the thank-you page. PATCHes the SAME lead (by id) with
 * email / budget / message — none required, but at least one must be filled.
 */
export function ThankYouOptionalForm({ leadId }: { leadId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const budget = String(data.get("budget") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!email && !budget && !message) return; // require at least one field

    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/track/lead", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email, budget, message }),
      });
      const d = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (!res.ok || !d?.ok) throw new Error(d?.error ?? "Could not save details.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-card border border-line bg-surface p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
          <Icon name="check" className="size-6" />
        </span>
        <p className="mt-4 text-lg font-medium text-ink">Got it — thank you!</p>
        <p className="mt-1 text-base text-body">
          We now have your details and will tailor the options we share.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-gold";
  const label = "mb-1.5 block text-sm font-medium text-ink-3";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-card border border-line bg-surface p-6 text-left sm:p-8"
    >
      <h2 className="text-xl text-ink">Want a more tailored callback?</h2>
      <p className="mt-1 text-sm text-body">
        Optional — add anything below and we&rsquo;ll come prepared. Or just wait
        for our call.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ty-email" className={label}>
            Email
          </label>
          <input
            id="ty-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="ty-budget" className={label}>
            Budget Range
          </label>
          <select
            id="ty-budget"
            name="budget"
            defaultValue=""
            className={`${field} cursor-pointer`}
          >
            <option value="">Select budget (optional)</option>
            {budgetOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ty-message" className={label}>
            Message
          </label>
          <textarea
            id="ty-message"
            name="message"
            rows={3}
            placeholder="Anything specific you're looking for? (floor, carpet area, timeline…)"
            className={`${field} resize-none`}
          />
        </div>
      </div>

      {status === "error" ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Saving…" : "Add these details"}
        {status !== "submitting" ? <Icon name="arrowRight" className="size-5" /> : null}
      </Button>
    </form>
  );
}
