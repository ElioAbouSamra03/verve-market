"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export function Header() {
  const { cart } = useCart();
  const { items } = useWishlist();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 font-display text-xl tracking-tight text-ink">
          Verve<span className="text-moss-700">Market</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-ink/70 md:flex">
          <Link href="/products" className="hover:text-ink">
            Shop
          </Link>
          <Link href="/categories/home" className="hover:text-ink">
            Home
          </Link>
          <Link href="/categories/kitchen" className="hover:text-ink">
            Kitchen
          </Link>
          <Link href="/categories/apparel" className="hover:text-ink">
            Apparel
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
          <label className="sr-only" htmlFor="site-search">
            Search products
          </label>
          <input
            id="site-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <Link
            href="/wishlist"
            className="relative text-sm text-ink/70 hover:text-ink"
            aria-label={`Wishlist, ${items.length} items`}
          >
            Wishlist
            {items.length > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-paper hover:bg-moss-900"
            aria-label={`Cart, ${cart?.itemCount ?? 0} items`}
          >
            Cart
            {(cart?.itemCount ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-moss-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {cart?.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
