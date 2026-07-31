import { isAdmin } from "@/lib/admin/server/auth";
import { heatmapData, EMPTY_HEATMAP } from "@/lib/admin/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await heatmapData());
  } catch {
    return Response.json(EMPTY_HEATMAP);
  }
}
