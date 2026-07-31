"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-admin-border bg-admin-card">
          <Lock className="size-5 text-admin-accent" />
        </div>
        <h1 className="mt-5 font-display text-xl font-semibold text-admin-fg">
          Blanca Analytics
        </h1>
        <p className="mt-1 text-admin-muted">Sign in to the admin panel</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-admin-border bg-admin-card p-6"
      >
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-xs font-medium text-admin-fg-2"
        >
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full rounded-xl border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-fg outline-none transition-colors placeholder:text-admin-muted focus:border-admin-accent"
        />

        {error ? (
          <p className="mt-3 rounded-lg border border-admin-danger/30 bg-admin-danger/10 px-3 py-2 text-xs text-admin-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-admin-accent px-4 py-2.5 font-medium text-black transition-all hover:bg-admin-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-admin-muted">
        Protected area · authorised personnel only
      </p>
    </div>
  );
}
