import { prisma } from "@/lib/prisma";
import { ensureSession } from "@/lib/track/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b?.sessionId || !Array.isArray(b.events) || !b.events.length) {
      return Response.json({ ok: false }, { status: 200 });
    }
    if (b.visitorId) await ensureSession(b.sessionId, b.visitorId);

    await prisma.replayEvent.create({
      data: {
        sessionId: b.sessionId,
        seq: typeof b.seq === "number" ? b.seq : 0,
        events: b.events,
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 200 });
  }
}
