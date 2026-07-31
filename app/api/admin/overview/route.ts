import { isAdmin } from "@/lib/admin/server/auth";
import { overviewData, EMPTY_OVERVIEW } from "@/lib/admin/server/queries";
import type { DateRange } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGES = new Set(["today", "yesterday", "7d", "30d", "90d"]);

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "7d";
  try {
    const data = await overviewData((RANGES.has(range) ? range : "7d") as DateRange);
    return Response.json(data);
  } catch {
    // No DB / empty DB → honest zero state, never a 500.
    return Response.json(EMPTY_OVERVIEW());
  }
}
