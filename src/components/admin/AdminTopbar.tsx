"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { useToast } from "./ToastProvider";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";

export function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { showError } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await api.post("/api/admin/auth/logout");
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to log out.");
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <Link href="/admin" className="font-display text-lg text-ink md:hidden">
          Verve<span className="text-moss-700">Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="text-sm text-ink/60 hover:text-ink" target="_blank">
            View storefront ↗
          </Link>
          <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={isLoggingOut}>
            Log out
          </Button>
        </div>
      </div>
      {/* Sidebar is hidden below md; this scrollable strip keeps every
          section reachable on phones/tablets. */}
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                isActive ? "bg-moss-50 text-moss-900" : "text-ink/60 hover:bg-sand hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
