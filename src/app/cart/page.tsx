"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LineSkeleton } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/format";

export default function CartPage() {
  const { cart, isLoading, error, clear, refresh } = useCart();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Your cart</h1>

      {isLoading && (
        <div className="mt-8 space-y-4">
          <LineSkeleton className="h-24 w-full" />
          <LineSkeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && error && cart?.items.length === 0 && (
        <div className="mt-8">
          <ErrorState onRetry={refresh} message={error} />
        </div>
      )}

      {!isLoading && cart && cart.items.length === 0 && !error && (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Browse the catalog and add something you'll actually use."
            action={
              <Link href="/products">
                <Button>Shop products</Button>
              </Link>
            }
          />
        </div>
      )}

      {!isLoading && cart && cart.items.length > 0 && (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            {cart.items.map((item) => (
              <CartLineItem key={`${item.productId}-${item.variantId ?? "base"}`} item={item} />
            ))}
            <button
              onClick={() => clear()}
              className="mt-4 text-xs text-ink/50 underline hover:text-ember"
            >
              Clear cart
            </button>
          </div>

          <aside className="h-fit rounded-lg border border-line bg-sand/40 p-5">
            <h2 className="font-display text-lg text-ink">Order summary</h2>
            <div className="mt-4 flex justify-between text-sm text-ink/70">
              <span>Subtotal ({cart.itemCount} items)</span>
              <span className="font-mono text-ink">{formatPrice(cart.subtotalCents, cart.currency)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/40">Shipping and taxes calculated at checkout.</p>
            <Button size="lg" className="mt-5 w-full">
              Proceed to checkout
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
