import { isAdmin } from "@/lib/admin/server/auth";
import type { EngagementRange } from "@/lib/admin/server/engagement";
import { campaignRows, metaAccountStatus } from "@/lib/meta/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const range = (new URL(req.url).searchParams.get("range") || "30d") as EngagementRange;
  try {
    const [account, campaigns] = await Promise.all([
      metaAccountStatus(),
      campaignRows(range),
    ]);
    return Response.json({ account, campaigns });
  } catch {
    return Response.json({
      account: {
        connected: false, accountId: "", name: "", currency: "",
        lastSyncedAt: null, lastSyncError: null, tokenExpiresAt: null,
      },
      campaigns: [],
    });
  }
}
