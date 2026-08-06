import { isAdmin } from "@/lib/admin/server/auth";
import {
  EMPTY_FUNNELS,
  funnelsData,
  type EngagementRange,
} from "@/lib/admin/server/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const range = (new URL(req.url).searchParams.get("range") || "30d") as EngagementRange;
  try {
    return Response.json(await funnelsData(range));
  } catch {
    return Response.json(EMPTY_FUNNELS);
  }
}
