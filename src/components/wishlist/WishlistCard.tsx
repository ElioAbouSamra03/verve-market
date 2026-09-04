"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/format";
import type { WishlistItem } from "@/types/wishlist";

export function WishlistCard({ item }: { item: WishlistItem }) {
  const { addItem } = useCart();
  const { toggle } = useWishlist();
  const [pending, setPending] = useState<"add" | "remove" | null>(null);

  async function handleAddToCart() {
    setPending("add");
    try {
      await addItem(item.productId, 1);
    } finally {
      setPending(null);
    }
  }

  async function handleRemove() {
    setPending("remove");
    try {
      await toggle(item.productId);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-4 border-b border-line py-5">
      <Link
        href={`/products/${item.productSnapshot.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-sand"
      >
        {item.productSnapshot.image && (
          <Image src={item.productSnapshot.image} alt={item.productSnapshot.name} fill className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/products/${item.productSnapshot.slug}`} className="font-medium text-ink hover:underline">
            {item.productSnapshot.name}
          </Link>
          <p className="mt-1 font-mono text-sm text-ink">
            {formatPrice(item.productSnapshot.priceCents, item.productSnapshot.currency)}
          </p>
          {!item.productSnapshot.inStock && (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ember">Out of stock</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleAddToCart}
            isLoading={pending === "add"}
            disabled={!item.productSnapshot.inStock || pending !== null}
          >
            Add to cart
          </Button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending !== null}
            className="text-xs text-ink/50 underline hover:text-ember disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
