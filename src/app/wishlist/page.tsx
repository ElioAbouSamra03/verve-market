"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LineSkeleton } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const { items, isLoading, error, refresh } = useWishlist();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Your wishlist</h1>

      {isLoading && (
        <div className="mt-8 space-y-4">
          <LineSkeleton className="h-24 w-full" />
          <LineSkeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && error && items.length === 0 && (
        <div className="mt-8">
          <ErrorState onRetry={refresh} message={error} />
        </div>
      )}

      {!isLoading && items.length === 0 && !error && (
        <div className="mt-8">
          <EmptyState
            title="Nothing saved yet"
            description="Tap the heart on any product to save it here for later."
            action={
              <Link href="/products">
                <Button>Discover products</Button>
              </Link>
            }
          />
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mt-8 max-w-2xl">
          {items.map((item) => (
            <WishlistCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
