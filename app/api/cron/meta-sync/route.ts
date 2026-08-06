import { syncAllMetaAccounts } from "@/lib/meta/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** The Graph API is slow; a default 10s budget would kill every run. */
export const maxDuration = 300;

/**
 * Scheduled ad sync.
 *
 * Gated by CRON_SECRET rather than the admin cookie, because a scheduler has no
 * session. Without the secret set, the route refuses to run at all — an open
 * endpoint here would let anyone burn our Graph API quota.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ")
    ? auth.slice(7)
    : new URL(req.url).searchParams.get("secret") || "";
  if (provided !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const lookbackParam = Number(new URL(req.url).searchParams.get("days"));
  const lookback = Number.isFinite(lookbackParam) && lookbackParam > 0
    ? Math.min(lookbackParam, 90)
    : undefined;

  const results = await syncAllMetaAccounts(lookback);
  return Response.json({
    ok: results.every((r) => r.ok),
    accounts: results.length,
    results,
  });
}
