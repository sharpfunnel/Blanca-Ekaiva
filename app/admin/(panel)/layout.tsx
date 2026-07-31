import { AdminNavbar } from "@/components/admin/AdminNavbar";

/** Shell for every authenticated admin page: sticky navbar + content well. */
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNavbar />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </>
  );
}
