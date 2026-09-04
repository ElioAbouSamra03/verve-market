"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_NAV_ITEMS: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/cart", label: "Cart" },
  { href: "/admin/wishlist", label: "Wishlist" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-white md:block">
      <div className="px-5 py-5">
        <Link href="/admin" className="font-display text-lg text-ink">
          Verve<span className="text-moss-700">Admin</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 px-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-moss-50 text-moss-900" : "text-ink/60 hover:bg-sand hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
