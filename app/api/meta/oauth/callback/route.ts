import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/server/auth";
import { prisma } from "@/lib/prisma";
import { GRAPH_BASE, exchangeForLongLivedToken, graphGet } from "@/lib/meta/graph";
import { OAUTH_STATE_COOKIE } from "../start/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TokenResponse {
  access_token: string;
}

interface AdAccount {
  account_id: string;
  name?: string;
  currency?: string;
  timezone_name?: string;
}

/** Sends the operator back to the campaigns page with a readable message. */
function back(origin: string, params: Record<string, string>) {
  const url = new URL("/admin/campaigns", origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url.toString(), 302);
}

/**
 * Step 2: exchange the code for a token, upgrade it to a long-lived one, and
 * store the first ad account it can see.
 */
export async function GET(req: Request) {
  if (!(await isAdmin()))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);

  if (url.searchParams.get("error")) {
    return back(origin, {
      meta_error: url.searchParams.get("error_description") || "Access denied.",
    });
  }
  if (!code) return back(origin, { meta_error: "No authorization code returned." });
  // A missing or mismatched state means this callback did not originate from
  // the flow we started.
  if (!state || !expected || state !== expected) {
    return back(origin, { meta_error: "Invalid OAuth state — please retry." });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return back(origin, {
      meta_error: "META_APP_ID / META_APP_SECRET are not configured.",
    });
  }

  try {
    const tokenUrl = new URL(`${GRAPH_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", `${origin}/api/meta/oauth/callback`);
    tokenUrl.searchParams.set("code", code);

    const res = await fetch(tokenUrl, { cache: "no-store" });
    const json = (await res.json()) as TokenResponse & {
      error?: { message?: string };
    };
    if (!res.ok || json.error || !json.access_token) {
      return back(origin, {
        meta_error: json.error?.message || "Token exchange failed.",
      });
    }

    // Short-lived tokens die in about an hour, which would break the nightly
    // cron on day one.
    const longLived = await exchangeForLongLivedToken(json.access_token);

    const accounts = await graphGet<{ data: AdAccount[] }>(
      "me/adaccounts",
      { fields: "account_id,name,currency,timezone_name", limit: "25" },
      longLived.accessToken
    );
    const account = accounts.data?.[0];
    if (!account) {
      return back(origin, {
        meta_error: "This Meta user can't see any ad accounts.",
      });
    }

    const data = {
      name: account.name ?? null,
      currency: account.currency ?? null,
      timezone: account.timezone_name ?? null,
      accessToken: longLived.accessToken,
      tokenExpiresAt: longLived.expiresAt,
      lastSyncError: null,
    };
    await prisma.metaAdAccount.upsert({
      where: { accountId: account.account_id },
      create: { accountId: account.account_id, ...data },
      update: data,
    });

    return back(origin, { meta_connected: account.account_id });
  } catch (e) {
    return back(origin, { meta_error: (e as Error).message.slice(0, 200) });
  }
}
