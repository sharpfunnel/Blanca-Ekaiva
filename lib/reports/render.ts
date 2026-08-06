import "server-only";

import type { Report } from "@/lib/admin/reports";

/**
 * Turns a Report into bytes.
 *
 * CSV is hand-rolled (it is twenty lines and a dependency would be silly);
 * XLSX and PDF go through exceljs and pdfkit, which are imported dynamically so
 * a request for a CSV never pays to load either.
 */

export function toCsv(report: Report): string {
  const rows = report.rows;
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Quote when the value contains a delimiter, a quote, or a newline; double
    // any embedded quotes. This is the whole of RFC 4180 that matters.
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
  ].join("\r\n");
}

export async function toXlsx(report: Report): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Blanca Analytics";
  workbook.created = new Date();

  // Sheet names cannot exceed 31 chars or contain []:*?/\ — Excel refuses the
  // whole file rather than sanitising it.
  const sheet = workbook.addWorksheet(
    report.title.replace(/[[\]:*?/\\]/g, "-").slice(0, 31) || "Report"
  );

  const rows = report.rows;
  if (rows.length) {
    const cols = Object.keys(rows[0]);
    sheet.columns = cols.map((c) => ({
      header: c,
      key: c,
      width: Math.min(40, Math.max(12, c.length + 4)),
    }));
    for (const row of rows) sheet.addRow(row);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3E9D2" },
    };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  } else {
    sheet.addRow(["No data in this range"]);
  }

  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}

export async function toPdf(report: Report): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;

  return new Promise((resolve, reject) => {
    // Landscape: these are wide tables, and portrait would clip every one.
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).fillColor("#1a1a1a").text(report.title);
    doc
      .fontSize(9)
      .fillColor("#777")
      .text(`Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`);
    doc.moveDown(0.8);

    const rows = report.rows;
    if (!rows.length) {
      doc.fontSize(11).fillColor("#555").text("No data in this range.");
      doc.end();
      return;
    }

    const cols = Object.keys(rows[0]);
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / cols.length;
    const rowHeight = 16;

    const header = (y: number) => {
      doc.fontSize(8).fillColor("#000");
      cols.forEach((c, i) => {
        doc.text(c, doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 4,
          ellipsis: true,
        });
      });
      doc
        .moveTo(doc.page.margins.left, y + rowHeight - 4)
        .lineTo(doc.page.width - doc.page.margins.right, y + rowHeight - 4)
        .strokeColor("#ccc")
        .stroke();
    };

    let y = doc.y;
    header(y);
    y += rowHeight;

    for (const row of rows) {
      // Start a new page (and repeat the header) before running off the bottom.
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        header(y);
        y += rowHeight;
      }
      doc.fontSize(8).fillColor("#333");
      cols.forEach((c, i) => {
        doc.text(String(row[c] ?? ""), doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 4,
          ellipsis: true,
        });
      });
      y += rowHeight;
    }

    doc.end();
  });
}

export const CONTENT_TYPE = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;
