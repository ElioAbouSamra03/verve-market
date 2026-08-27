"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { WishlistItem } from "@/types/wishlist";

interface WishlistContextValue {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<WishlistItem[]>("/api/wishlist");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggle = useCallback(
    async (productId: string) => {
      setError(null);
      const already = items.some((i) => i.productId === productId);
      try {
        if (already) {
          await api.delete(`/api/wishlist/${productId}`);
        } else {
          await api.post("/api/wishlist", { productId });
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update wishlist.");
        throw err;
      }
    },
    [items, refresh]
  );

  const value = useMemo(
    () => ({ items, isLoading, error, isWishlisted, toggle, refresh }),
    [items, isLoading, error, isWishlisted, toggle, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
