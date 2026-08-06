import { isAdmin } from "@/lib/admin/server/auth";
import { buildReport, type ReportFormat, type ReportKind } from "@/lib/admin/reports";
import { CONTENT_TYPE, toCsv, toPdf, toXlsx } from "@/lib/reports/render";
import type { EngagementRange } from "@/lib/admin/server/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A PDF of ten thousand leads is not instant. */
export const maxDuration = 120;

const KINDS = new Set<ReportKind>(["overview", "leads", "campaigns"]);
const FORMATS = new Set<ReportFormat>(["csv", "xlsx", "pdf"]);
const RANGES = new Set<EngagementRange>(["7d", "30d", "90d", "all"]);

/**
 * Streams a report out as CSV, XLSX or PDF.
 *
 * Admin-only: these contain every lead's name, phone and email.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string }> }
) {
  if (!(await isAdmin()))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  const { kind } = await params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "csv") as ReportFormat;
  const range = (url.searchParams.get("range") || "30d") as EngagementRange;

  if (!KINDS.has(kind as ReportKind))
    return Response.json({ error: "Unknown report" }, { status: 404 });
  if (!FORMATS.has(format))
    return Response.json({ error: "Unknown format" }, { status: 400 });
  if (!RANGES.has(range))
    return Response.json({ error: "Unknown range" }, { status: 400 });

  try {
    const report = await buildReport(kind as ReportKind, range);
    const filename = `blanca-${kind}-${range}.${format}`;

    const body =
      format === "csv"
        ? toCsv(report)
        : format === "xlsx"
          ? await toXlsx(report)
          : await toPdf(report);

    return new Response(body as BodyInit, {
      headers: {
        "Content-Type": CONTENT_TYPE[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Reports are a point-in-time snapshot; a cached one is a wrong one.
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { error: (e as Error).message.slice(0, 200) },
      { status: 500 }
    );
  }
}
