/**
 * Types specific to the admin dashboard (not part of the public storefront
 * domain model in types/product.ts, types/user.ts, etc.).
 */
import type { Product } from "./product";
import type { CartItem } from "./cart";
import type { WishlistItem } from "./wishlist";

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  cartLineItemCount: number;
  cartTotalUnits: number;
  wishlistItemCount: number;
  lowStockProducts: Product[];
  recentProducts: Product[];
}

export interface AdminCartItemRow extends CartItem {
  lineTotalCents: number;
}

export type AdminWishlistItemRow = WishlistItem;
