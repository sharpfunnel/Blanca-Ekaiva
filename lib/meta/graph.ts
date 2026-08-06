import "server-only";

/**
 * Thin Graph API client for the Ads subsystem.
 *
 * Shares the version pin with the Conversions API sender but nothing else: CAPI
 * writes conversions with a dataset token, this reads ad performance with a
 * user token, and conflating the two credentials is how tokens end up with more
 * scope than they need.
 */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number
  ) {
    super(message);
    this.name = "GraphError";
  }
}

interface GraphPage<T> {
  data: T[];
  paging?: { next?: string; cursors?: { after?: string } };
}

/** One GET, with Meta's error envelope turned into a thrown GraphError. */
export async function graphGet<T>(
  path: string,
  params: Record<string, string | undefined>,
  accessToken: string
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  let json: { error?: { message?: string; code?: number } } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    /* non-JSON body — surface the raw text below */
  }
  if (!res.ok || json.error) {
    throw new GraphError(
      json.error?.message || `HTTP ${res.status}: ${text.slice(0, 300)}`,
      res.status,
      json.error?.code
    );
  }
  return json as T;
}

/**
 * Follows `paging.next` until exhausted.
 *
 * `maxPages` is a deliberate stop: an account with years of history would
 * otherwise walk thousands of pages inside one cron invocation and time out
 * having written nothing. Callers log when the cap is hit.
 */
export async function graphGetAll<T>(
  path: string,
  params: Record<string, string | undefined>,
  accessToken: string,
  maxPages = 20
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  let page = await graphGet<GraphPage<T>>(path, { ...params, limit: "100" }, accessToken);
  rows.push(...(page.data ?? []));

  let pages = 1;
  while (page.paging?.next && pages < maxPages) {
    const res = await fetch(page.paging.next, { cache: "no-store" });
    if (!res.ok) break;
    page = (await res.json()) as GraphPage<T>;
    rows.push(...(page.data ?? []));
    pages += 1;
  }
  return { rows, truncated: Boolean(page.paging?.next) && pages >= maxPages };
}

/**
 * Exchanges a short-lived user token for a long-lived one (~60 days), and
 * re-ups an existing long-lived token. Meta returns a fresh token with a fresh
 * expiry, so this doubles as the refresh path.
 */
export async function exchangeForLongLivedToken(shortToken: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new GraphError("META_APP_ID and META_APP_SECRET are not configured.", 500);
  }

  const json = await graphGet<{ access_token: string; expires_in?: number }>(
    "oauth/access_token",
    {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    },
    // This particular endpoint takes the token as a parameter, not as auth.
    ""
  );

  return {
    accessToken: json.access_token,
    // Meta omits expires_in for never-expiring tokens; treat that as 60 days
    // rather than "never", so the refresh path still runs.
    expiresAt: new Date(Date.now() + (json.expires_in ?? 60 * 24 * 3600) * 1000),
  };
}
