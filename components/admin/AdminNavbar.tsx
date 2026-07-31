"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, ExternalLink, LogOut, BarChart3 } from "lucide-react";
import { NAV_ITEMS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-admin-border bg-admin-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        {/* Left — logo + project */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-admin-accent">
            <BarChart3 className="size-4 text-black" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold text-admin-fg">
              Blanca
            </span>
            <span className="text-[10px] tracking-wide text-admin-muted">
              Analytics
            </span>
          </span>
        </Link>

        {/* Center — navigation */}
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "text-admin-fg"
                    : "text-admin-muted hover:text-admin-fg-2"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg border border-admin-border bg-admin-card"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  <item.icon className="size-3.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right — actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-admin-border bg-admin-card px-2.5 py-1.5 text-xs font-medium text-admin-fg-2 transition-colors hover:text-admin-fg sm:flex"
          >
            <ExternalLink className="size-3.5" />
            View Website
          </a>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-8 items-center justify-center rounded-lg border border-admin-border bg-admin-card text-admin-fg-2 transition-colors hover:text-admin-fg"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-admin-accent" />
          </button>

          <div className="flex size-8 items-center justify-center rounded-lg bg-admin-card-2 text-xs font-semibold text-admin-fg ring-1 ring-admin-border">
            RT
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            aria-label="Log out"
            className="flex size-8 items-center justify-center rounded-lg border border-admin-border bg-admin-card text-admin-fg-2 transition-colors hover:text-admin-danger disabled:opacity-50"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-admin-border px-3 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border border-admin-border bg-admin-card text-admin-fg"
                  : "text-admin-muted"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
