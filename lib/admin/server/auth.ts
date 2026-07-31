import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  getSessionSecret,
  verifySessionToken,
} from "@/lib/admin-auth";

/**
 * Guard for /api/admin/* data routes. The Edge proxy only covers page routes
 * (/admin/**), so the JSON endpoints verify the same signed cookie themselves.
 */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, getSessionSecret());
}
