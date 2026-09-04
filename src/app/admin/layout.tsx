import type { Metadata } from "next";
import { ToastProvider } from "@/components/admin/ToastProvider";

export const metadata: Metadata = {
  title: "Admin — Verve Market",
  description: "Store management dashboard for Verve Market.",
};

// Root layout for everything under /admin — separate from the storefront's
// layout.tsx (no storefront Header/Footer/Cart/Wishlist providers here).
// ToastProvider lives here so both the login page and the protected
// dashboard share one feedback channel.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
