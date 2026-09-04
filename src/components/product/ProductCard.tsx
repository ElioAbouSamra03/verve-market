"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { Price, RatingStars } from "@/components/ui/Price";
import type { ProductSummary } from "@/types/product";

export function ProductCard({ product }: { product: ProductSummary }) {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.productId);
  const outOfStock = product.stock <= 0;

  return (
    <div className="group relative flex flex-col">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(product.productId).catch(() => {});
        }}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-card transition-transform hover:scale-105"
      >
        <span className={wishlisted ? "text-ember" : "text-ink/50"}>{wishlisted ? "♥" : "♡"}</span>
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-sand">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink/30">No image</div>
          )}
          {outOfStock && (
            <span className="absolute bottom-2 left-2 rounded-sm bg-ink/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-paper">
              Out of stock
            </span>
          )}
          {product.compareAtPriceCents && !outOfStock && (
            <span className="absolute bottom-2 left-2 rounded-sm bg-ember px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sale
            </span>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-ink/40">{product.categoryName}</p>
          <h3 className="line-clamp-1 text-sm font-medium text-ink">{product.name}</h3>
          {typeof product.rating === "number" && (
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          )}
          <Price cents={product.priceCents} compareAtCents={product.compareAtPriceCents} currency={product.currency} />
        </div>
      </Link>
    </div>
  );
}
