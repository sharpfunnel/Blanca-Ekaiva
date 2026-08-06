import { isAdmin } from "@/lib/admin/server/auth";
import type { EngagementRange } from "@/lib/admin/server/engagement";
import { campaignDetail } from "@/lib/meta/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const range = (new URL(req.url).searchParams.get("range") || "30d") as EngagementRange;
  try {
    const detail = await campaignDetail(id, range);
    if (!detail) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(detail);
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
