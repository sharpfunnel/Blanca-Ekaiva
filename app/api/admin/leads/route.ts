import { isAdmin } from "@/lib/admin/server/auth";
import { fetchLeads } from "@/lib/admin/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await fetchLeads(300));
  } catch {
    return Response.json([]);
  }
}
