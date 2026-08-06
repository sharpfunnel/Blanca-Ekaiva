import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const OAUTH_STATE_COOKIE = "meta_oauth_state";

/**
 * Step 1 of connecting an ad account: redirect the operator to Meta's consent
 * screen. Admin-only — this grants our app access to the business's ad data.
 */
export async function GET(req: Request) {
  if (!(await isAdmin()))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return Response.json(
      { error: "META_APP_ID is not configured." },
      { status: 500 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const redirectUri = `${origin}/api/meta/oauth/callback`;

  // CSRF: a random state echoed back by Meta and compared on return. Stored in
  // an httpOnly cookie so the browser cannot read or forge it.
  const state = randomBytes(16).toString("hex");
  (await cookies()).set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  // Read-only: this subsystem never creates or edits ads.
  url.searchParams.set("scope", "ads_read");

  return Response.redirect(url.toString(), 302);
}
