import { isAdmin } from "@/lib/admin/server/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the full rrweb event stream for one session, chunks stitched in order. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({ events: [] }, { status: 400 });

  try {
    const chunks = await prisma.replayEvent.findMany({
      where: { sessionId },
      orderBy: { seq: "asc" },
      select: { events: true },
    });
    const events = chunks.flatMap((c) => (Array.isArray(c.events) ? c.events : []));
    return Response.json({ events });
  } catch {
    return Response.json({ events: [] });
  }
}
