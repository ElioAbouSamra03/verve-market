"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils/format";
import type { CartItem } from "@/types/cart";

export function CartLineItem({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();
  const [pending, setPending] = useState(false);
  const lineTotal = item.quantity * item.productSnapshot.unitPriceCents;

  async function handleQuantityChange(next: number) {
    if (next < 1) return;
    setPending(true);
    try {
      await updateQuantity(item.productId, next, item.variantId);
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await removeItem(item.productId, item.variantId);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-4 border-b border-line py-5">
      <Link href={`/products/${item.productSnapshot.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-sand">
        {item.productSnapshot.image && (
          <Image src={item.productSnapshot.image} alt={item.productSnapshot.name} fill className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div>
            <Link href={`/products/${item.productSnapshot.slug}`} className="font-medium text-ink hover:underline">
              {item.productSnapshot.name}
            </Link>
            {item.productSnapshot.variantLabel && (
              <p className="text-xs text-ink/50">{item.productSnapshot.variantLabel}</p>
            )}
          </div>
          <p className="font-mono text-sm font-medium text-ink">
            {formatPrice(lineTotal, item.productSnapshot.currency)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-md border border-line">
            <button
              type="button"
              className="px-2.5 py-1 text-ink/70 hover:text-ink disabled:opacity-30"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={pending || item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              className="px-2.5 py-1 text-ink/70 hover:text-ink disabled:opacity-30"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={pending}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            className="text-xs text-ink/50 underline hover:text-ember disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
