import { isAdmin } from "@/lib/admin/server/auth";
import { techStackData, EMPTY_TECH } from "@/lib/admin/server/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await techStackData());
  } catch {
    return Response.json(EMPTY_TECH);
  }
}
