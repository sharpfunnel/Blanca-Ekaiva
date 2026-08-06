import { isAdmin } from "@/lib/admin/server/auth";
import { capiDeliveries, metaAccountStatus } from "@/lib/meta/queries";
import { syncMetaAccount } from "@/lib/meta/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Account status + the CAPI delivery log for /admin/meta-capi. */
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [account, deliveries] = await Promise.all([
      metaAccountStatus(),
      capiDeliveries(),
    ]);
    return Response.json({ account, deliveries });
  } catch {
    return Response.json({ account: null, deliveries: [] });
  }
}

/** Manual "Sync now" from the campaigns page. */
export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const account = await metaAccountStatus();
  if (!account.connected) {
    return Response.json(
      { ok: false, error: "No ad account connected." },
      { status: 400 }
    );
  }
  const result = await syncMetaAccount(account.accountId);
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
