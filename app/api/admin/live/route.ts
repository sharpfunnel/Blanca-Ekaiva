import { isAdmin } from "@/lib/admin/server/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sessions active in the last 5 minutes — polled by the LiveBadge. */
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const count = await prisma.session.count({
      where: { lastActiveAt: { gte: cutoff } },
    });
    return Response.json({ count });
  } catch {
    return Response.json({ count: 0 });
  }
}
