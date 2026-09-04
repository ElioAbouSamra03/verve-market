import { requireAdminPage } from "@/lib/auth/adminSession";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

// Protects every route under this group in one place: if there's no valid
// admin session, requireAdminPage() redirects to /admin/login before any
// child page renders or fetches data.
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  requireAdminPage();

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
