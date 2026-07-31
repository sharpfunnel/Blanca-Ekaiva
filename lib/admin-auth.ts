/**
 * Password-via-env admin auth, signed as a stateless HMAC cookie.
 *
 * Everything here uses the Web Crypto API (`globalThis.crypto.subtle`) so the
 * exact same code runs in the Edge proxy (proxy.ts) and in Node route handlers.
 * No database, no user table — a single shared password gates /admin.
 */

const encoder = new TextEncoder();

export const SESSION_COOKIE = "blanca_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(sig);
}

/** The secret used to sign sessions. Falls back to the password itself. */
export function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "insecure-dev-secret-change-me"
  );
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = b64url(
    encoder.encode(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 }))
  );
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = await hmac(payload, secret);
  if (expected !== sig) return false;

  try {
    const json = JSON.parse(b64urlDecode(payload)) as { exp?: number };
    return typeof json.exp === "number" && json.exp > Date.now();
  } catch {
    return false;
  }
}
