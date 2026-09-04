"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { CartSummary } from "@/types/cart";

interface CartContextValue {
  cart: CartSummary | null;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_CART: CartSummary = { items: [], itemCount: 0, subtotalCents: 0, currency: "USD" };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.get<CartSummary>("/api/cart");
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart.");
      setCart((prev) => prev ?? EMPTY_CART);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      setError(null);
      try {
        await api.post("/api/cart", { productId, quantity, variantId });
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add item to cart.");
        throw err;
      }
    },
    [refresh]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      setError(null);
      try {
        const suffix = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
        await api.patch(`/api/cart/${productId}${suffix}`, { quantity });
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update quantity.");
        throw err;
      }
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      setError(null);
      try {
        const suffix = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
        await api.delete(`/api/cart/${productId}${suffix}`);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not remove item.");
        throw err;
      }
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    setError(null);
    try {
      await api.delete("/api/cart");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear cart.");
      throw err;
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ cart, isLoading, error, addItem, updateQuantity, removeItem, clear, refresh }),
    [cart, isLoading, error, addItem, updateQuantity, removeItem, clear, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
