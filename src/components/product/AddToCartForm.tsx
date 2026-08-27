"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/product";

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const outOfStock = availableStock <= 0;
  const wishlisted = isWishlisted(product.productId);

  async function handleAddToCart() {
    setStatus("loading");
    setMessage(null);
    try {
      await addItem(product.productId, quantity, variantId);
      setStatus("success");
      setMessage(`Added ${quantity} to your cart.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not add to cart.");
    }
  }

  return (
    <div className="space-y-5">
      {product.variants && product.variants.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Option</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setVariantId(variant.id)}
                disabled={variant.stock <= 0}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  variantId === variant.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50" htmlFor="qty">
          Quantity
        </label>
        <div className="flex items-center rounded-md border border-line">
          <button
            type="button"
            className="px-3 py-1.5 text-ink/70 hover:text-ink disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            id="qty"
            type="number"
            min={1}
            max={Math.max(1, availableStock)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-12 border-x border-line py-1.5 text-center text-sm focus:outline-none"
          />
          <button
            type="button"
            className="px-3 py-1.5 text-ink/70 hover:text-ink disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
            disabled={quantity >= availableStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span className="text-xs text-ink/50">
          {outOfStock ? "Out of stock" : `${availableStock} in stock`}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          onClick={handleAddToCart}
          disabled={outOfStock}
          isLoading={status === "loading"}
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={() => toggle(product.productId).catch(() => {})}
        >
          {wishlisted ? "♥ Saved" : "♡ Save for later"}
        </Button>
      </div>

      {message && (
        <p role="status" className={`text-sm ${status === "error" ? "text-ember" : "text-moss-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
