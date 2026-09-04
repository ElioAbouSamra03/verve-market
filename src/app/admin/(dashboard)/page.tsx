import Link from "next/link";
import { getDashboardStats } from "@/lib/db/adminStats";
import { StatCard } from "@/components/admin/StatCard";
import { StockBadge } from "@/components/admin/Badge";
import { AdminTable, AdminTableHead, AdminTh, AdminTr, AdminTd } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic"; // dashboard counters should never be statically cached

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">A snapshot of the store right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Total products" value={stats.totalProducts} />
        <StatCard label="Total categories" value={stats.totalCategories} />
        <StatCard
          label="Cart items"
          value={stats.cartLineItemCount}
          hint={`${stats.cartTotalUnits} unit(s) across all carts`}
        />
        <StatCard label="Wishlist items" value={stats.wishlistItemCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Low stock</h2>
            <Link href="/admin/products?lowStockOnly=true" className="text-xs text-moss-700 hover:underline">
              View all
            </Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <EmptyState title="Nothing running low" description="Every product is comfortably stocked." />
          ) : (
            <AdminTable>
              <AdminTableHead>
                <AdminTh>Product</AdminTh>
                <AdminTh>Category</AdminTh>
                <AdminTh>Stock</AdminTh>
              </AdminTableHead>
              <tbody>
                {stats.lowStockProducts.map((product) => (
                  <AdminTr key={product.productId}>
                    <AdminTd>
                      <Link href={`/admin/products/${product.productId}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </AdminTd>
                    <AdminTd className="text-ink/60">{product.categoryName}</AdminTd>
                    <AdminTd>
                      <StockBadge stock={product.stock} />
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Recently added products</h2>
            <Link href="/admin/products" className="text-xs text-moss-700 hover:underline">
              View all
            </Link>
          </div>
          {stats.recentProducts.length === 0 ? (
            <EmptyState title="No products yet" description="Add your first product to get started." />
          ) : (
            <AdminTable>
              <AdminTableHead>
                <AdminTh>Product</AdminTh>
                <AdminTh>Price</AdminTh>
                <AdminTh>Added</AdminTh>
              </AdminTableHead>
              <tbody>
                {stats.recentProducts.map((product) => (
                  <AdminTr key={product.productId}>
                    <AdminTd>
                      <Link href={`/admin/products/${product.productId}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </AdminTd>
                    <AdminTd>{formatPrice(product.priceCents, product.currency)}</AdminTd>
                    <AdminTd className="text-ink/60">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </section>
      </div>
    </div>
  );
}
