import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  MonitorPlay,
  Flame,
  Cpu,
  Filter,
  MousePointerClick,
  ClipboardList,
  Gauge,
  Bug,
  Megaphone,
  Send,
  FileDown,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Center navigation for the admin panel.
 *
 * Ordered by how often it is actually opened, not by how it was built: the
 * daily check first, then the CRM, then the diagnostic pages that get visited
 * when a number looks wrong.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Sessions", href: "/admin/sessions", icon: MonitorPlay },
  { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
  { label: "Funnels", href: "/admin/funnels", icon: Filter },
  { label: "CTAs", href: "/admin/ctas", icon: MousePointerClick },
  { label: "Forms", href: "/admin/forms", icon: ClipboardList },
  { label: "Heatmap", href: "/admin/heatmap", icon: Flame },
  { label: "Performance", href: "/admin/performance", icon: Gauge },
  { label: "Errors", href: "/admin/errors", icon: Bug },
  { label: "Tech Stack", href: "/admin/tech-stack", icon: Cpu },
  { label: "Meta CAPI", href: "/admin/meta-capi", icon: Send },
  { label: "Reports", href: "/admin/reports", icon: FileDown },
];
