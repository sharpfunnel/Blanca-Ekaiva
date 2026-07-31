"use client";

import { useState } from "react";
import { Download, FileText, Sheet, Check } from "lucide-react";

type Row = Record<string, unknown>;

function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
  ].join("\n");
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** CSV/Excel export from any array of flat rows. PDF/Print via the browser. */
export function ExportButton({
  rows: input,
  filename = "export",
}: {
  // Any array of flat objects — cast internally so callers can pass typed rows.
  rows: readonly object[];
  filename?: string;
}) {
  const rows = input as Row[];
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  const flash = () => {
    setDone(true);
    setTimeout(() => setDone(false), 1200);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-admin-border bg-admin-card px-2.5 py-1.5 text-xs font-medium text-admin-fg-2 transition-colors hover:text-admin-fg"
      >
        {done ? (
          <Check className="size-3.5 text-emerald-400" />
        ) : (
          <Download className="size-3.5" />
        )}
        Export
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-admin-border bg-admin-card-2 p-1 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                download(`${filename}.csv`, toCsv(rows), "text/csv");
                flash();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-admin-fg-2 hover:bg-admin-hover hover:text-admin-fg"
            >
              <FileText className="size-3.5" /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                // Excel opens CSV natively; a .xls extension nudges it there.
                download(`${filename}.xls`, toCsv(rows), "application/vnd.ms-excel");
                flash();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-admin-fg-2 hover:bg-admin-hover hover:text-admin-fg"
            >
              <Sheet className="size-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
                flash();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-admin-fg-2 hover:bg-admin-hover hover:text-admin-fg"
            >
              <FileText className="size-3.5" /> PDF / Print
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
