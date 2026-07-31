import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  getSessionSecret,
  verifySessionToken,
} from "@/lib/admin-auth";

/**
 * Edge guard for the admin panel (Next 16's `proxy`, formerly `middleware`).
 * Everything under /admin requires a valid signed session cookie; /admin/login
 * is the only exception so an unauthenticated user can reach the sign-in form.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await verifySessionToken(token, getSessionSecret());

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
