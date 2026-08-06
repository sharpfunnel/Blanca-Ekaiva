import { isAdmin } from "@/lib/admin/server/auth";
import { formStats, type EngagementRange } from "@/lib/admin/server/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const range = (new URL(req.url).searchParams.get("range") || "30d") as EngagementRange;
  try {
    return Response.json(await formStats(range));
  } catch {
    return Response.json([]);
  }
}
