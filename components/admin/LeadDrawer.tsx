"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  Wallet,
  Radio,
  MonitorSmartphone,
  Globe,
  Clock,
  MessageSquare,
} from "lucide-react";
import type { Lead } from "@/lib/admin/types";
import { formatDateTime, timeAgo } from "@/lib/admin/format";
import { LeadStatusBadge } from "./ui/Badge";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-admin-border bg-admin-card-2 text-admin-muted">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-admin-muted">{label}</p>
        <p className="truncate text-[13px] text-admin-fg">{value}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-medium tracking-wide text-admin-muted uppercase">
      {children}
    </p>
  );
}

export function LeadDrawer({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const rawEntries = lead ? Object.entries(lead.rawParams ?? {}) : [];

  return (
    <AnimatePresence>
      {lead ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-admin-border bg-admin-panel"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-admin-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-admin-accent font-display text-sm font-semibold text-black">
                  {lead.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className="font-display text-base font-semibold text-admin-fg">
                    {lead.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <LeadStatusBadge status={lead.status} />
                    <span className="text-[11px] text-admin-muted">
                      {lead.id}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-lg border border-admin-border text-admin-muted transition-colors hover:text-admin-fg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Contact + config */}
              <div>
                <SectionLabel>Contact & Requirement</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Row icon={Phone} label="Phone" value={lead.phone} />
                  <Row icon={Mail} label="Email" value={lead.email} />
                  <Row icon={Building2} label="Interested in" value={lead.interest} />
                  <Row icon={Wallet} label="Budget" value={lead.budget} />
                  <Row
                    icon={MapPin}
                    label="Location"
                    value={`${lead.city}, ${lead.country}`}
                  />
                  <Row icon={Clock} label="Submitted" value={timeAgo(lead.createdAt)} />
                </div>
              </div>

              {/* Acquisition */}
              <div>
                <SectionLabel>Acquisition</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Row icon={Radio} label="Source" value={lead.utmSource || lead.source} />
                  <Row icon={Radio} label="Medium" value={lead.utmMedium || "—"} />
                  <Row icon={Globe} label="Campaign" value={lead.utmCampaign || lead.campaign} />
                  <Row icon={Radio} label="Ad (content)" value={lead.utmContent || "—"} />
                  <Row icon={Radio} label="Adset (term)" value={lead.utmTerm || "—"} />
                  <Row icon={Radio} label="Placement" value={lead.placement || "—"} />
                </div>

                {rawEntries.length ? (
                  <div className="mt-4 rounded-xl border border-admin-border bg-admin-card p-3">
                    <p className="mb-2 text-[11px] font-medium tracking-wide text-admin-muted uppercase">
                      Landing URL params ({rawEntries.length})
                    </p>
                    <dl className="space-y-1">
                      {rawEntries.map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-[11px]">
                          <dt className="shrink-0 text-admin-muted">{k}</dt>
                          <dd className="truncate text-admin-fg-2" title={v}>
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </div>

              {/* Tech */}
              <div>
                <SectionLabel>Device & Network</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Row
                    icon={MonitorSmartphone}
                    label="Device"
                    value={`${lead.device} · ${lead.os}`}
                  />
                  <Row icon={Globe} label="Browser" value={lead.browser} />
                  <Row icon={Globe} label="IP Address" value={lead.ip} />
                  <Row icon={MonitorSmartphone} label="Assigned to" value={lead.assignedTo} />
                </div>
              </div>

              {/* Journey timeline */}
              <div>
                <SectionLabel>Visitor Journey</SectionLabel>
                <ol className="relative ml-1 space-y-4 border-l border-admin-border pl-5">
                  {lead.journey.map((step, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[23px] top-1 size-2.5 rounded-full border-2 border-admin-panel bg-admin-accent" />
                      <p className="text-[13px] text-admin-fg">{step.label}</p>
                      {step.detail ? (
                        <p className="text-[11px] text-admin-muted">{step.detail}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-admin-muted">
                        {formatDateTime(step.at)}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Notes */}
              <div>
                <SectionLabel>Notes</SectionLabel>
                {lead.notes.length ? (
                  <ul className="space-y-2">
                    {lead.notes.map((n, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-admin-border bg-admin-card p-3"
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-admin-muted">
                          <MessageSquare className="size-3" />
                          {n.author} · {timeAgo(n.at)}
                        </div>
                        <p className="mt-1.5 text-[13px] text-admin-fg-2">
                          {n.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-admin-muted">No notes yet.</p>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 border-t border-admin-border px-5 py-4">
              <a
                href={`tel:${lead.phone.replace(/\s/g, "")}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-admin-accent px-4 py-2.5 text-[13px] font-medium text-black transition-colors hover:bg-admin-accent-2"
              >
                <Phone className="size-4" /> Call
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-4 py-2.5 text-[13px] font-medium text-admin-fg transition-colors hover:bg-admin-hover"
              >
                <MessageSquare className="size-4" /> WhatsApp
              </a>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
