import type { Metadata } from "next";
import { AdminProviders } from "./providers";

export const metadata: Metadata = {
  title: "Admin · Blanca Analytics",
  // The panel must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Wraps every /admin route (including the login screen) in the dark surface and
 * the React Query provider. `color-scheme: dark` fixes native form controls and
 * scrollbars; `text-sm` normalises the base size away from the landing page's
 * 18px body copy, which is far too large for a dense dashboard.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-admin-bg text-sm text-admin-fg [color-scheme:dark]"
      style={{ fontFeatureSettings: '"cv11", "ss01"' }}
    >
      <AdminProviders>{children}</AdminProviders>
    </div>
  );
}
