import { cn } from "@/lib/utils";
import type { LeadStatus, SessionStatus } from "@/lib/admin/types";

export function Badge({
  className,
  children,
  dot,
}: {
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        className
      )}
    >
      {dot ? (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

const LEAD_STYLES: Record<LeadStatus, string> = {
  NEW: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  CONTACTED: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  QUALIFIED: "border-teal-500/25 bg-teal-500/10 text-teal-300",
  INTERESTED: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  SITE_VISIT_SCHEDULED: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  NEGOTIATION: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300",
  WON: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  LOST: "border-red-500/25 bg-red-500/10 text-red-300",
  SPAM: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400",
};

const LEAD_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  INTERESTED: "Interested",
  SITE_VISIT_SCHEDULED: "Site Visit",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  SPAM: "Spam",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge dot className={LEAD_STYLES[status]}>
      {LEAD_LABELS[status]}
    </Badge>
  );
}

const SESSION_STYLES: Record<SessionStatus, string> = {
  ACTIVE: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  IDLE: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  ENDED: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400",
  BOUNCED: "border-red-500/25 bg-red-500/10 text-red-300",
};

const SESSION_LABELS: Record<SessionStatus, string> = {
  ACTIVE: "Live",
  IDLE: "Idle",
  ENDED: "Ended",
  BOUNCED: "Bounced",
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return (
    <Badge
      dot
      className={cn(
        SESSION_STYLES[status],
        status === "ACTIVE" && "[&>span]:animate-pulse"
      )}
    >
      {SESSION_LABELS[status]}
    </Badge>
  );
}
