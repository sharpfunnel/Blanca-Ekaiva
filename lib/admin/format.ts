import type { MetricFormat } from "./types";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

/** ms → "2m 34s" / "45s" / "1h 04m". */
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatCurrencyLacs(n: number): string {
  return `₹${formatNumber(n)}`;
}

export function formatMetric(value: number, format: MetricFormat): string {
  switch (format) {
    case "percent":
      return formatPercent(value);
    case "duration":
      return formatDuration(value);
    case "currency":
      return formatCurrencyLacs(value);
    default:
      return formatNumber(value);
  }
}

/** ISO → "2m ago" / "3h ago" / "Yesterday" / "12 Jul". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Raw acquisition params → a short count + the full list for a title tooltip. */
export function formatRawParams(
  raw: Record<string, string> | null | undefined
): { preview: string; full: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const entries = Object.entries(raw);
  if (entries.length === 0) return null;
  return {
    preview: `${entries.length} param${entries.length === 1 ? "" : "s"}`,
    full: entries.map(([k, v]) => `${k}=${v}`).join("\n"),
  };
}
