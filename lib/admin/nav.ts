import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  MonitorPlay,
  Flame,
  Cpu,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Center navigation for the admin panel. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Sessions", href: "/admin/sessions", icon: MonitorPlay },
  { label: "Heatmap", href: "/admin/heatmap", icon: Flame },
  { label: "Tech Stack", href: "/admin/tech-stack", icon: Cpu },
];
