import { isAdmin } from "@/lib/admin/server/auth";
import { leadStats, EMPTY_LEAD_STATS } from "@/lib/admin/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await leadStats());
  } catch {
    return Response.json(EMPTY_LEAD_STATS);
  }
}
