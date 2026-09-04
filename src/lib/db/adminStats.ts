import { scanAllProducts } from "./products";
import { listCategories } from "./categories";
import { listUsers } from "./users";
import { listAllCartItems } from "./cart";
import { listAllWishlistItems } from "./wishlist";
import { DatabaseError } from "@/lib/errors";
import type { DashboardStats } from "@/types/admin";

const LOW_STOCK_THRESHOLD = 5;

/**
 * Aggregates the counters and short lists shown on the admin dashboard home
 * page. Runs the underlying scans/queries in parallel — at this project's
 * scale (a demo catalog, not a production-sized one) a handful of full-table
 * scans per dashboard load is an acceptable, well-understood trade-off (see
 * README "Known limitations"); a production version would maintain these as
 * running counters updated via DynamoDB Streams instead of recomputing them
 * on every request.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [products, categories, usersPage, cartItems, wishlistItems] = await Promise.all([
      scanAllProducts(),
      listCategories(),
      listUsers({ pageSize: 1 }),
      listAllCartItems(),
      listAllWishlistItems(),
    ]);

    const lowStockProducts = [...products]
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    const recentProducts = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers: usersPage.total,
      totalProducts: products.length,
      totalCategories: categories.length,
      cartLineItemCount: cartItems.length,
      cartTotalUnits: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      wishlistItemCount: wishlistItems.length,
      lowStockProducts,
      recentProducts,
    };
  } catch (err) {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError("Failed to load dashboard stats.", err);
  }
}
