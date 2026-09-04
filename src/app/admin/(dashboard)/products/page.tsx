"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { LineSkeleton } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchInput } from "@/components/admin/SearchInput";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { StockBadge, Badge } from "@/components/admin/Badge";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminTable, AdminTableHead, AdminTh, AdminTr, AdminTd } from "@/components/admin/AdminTable";
import { formatPrice } from "@/lib/utils/format";
import type { Product, PaginatedResult } from "@/types/product";
import type { Category } from "@/types/category";

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("lowStockOnly") === "true");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedResult<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingStockFor, setSavingStockFor] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    api.get<Category[]>("/api/admin/categories").then(setCategories).catch(() => {});
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (lowStockOnly) params.set("lowStockOnly", "true");
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    return params.toString();
  }, [q, category, lowStockOnly, sort, page]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResult<Product>>(`/api/admin/products?${query}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => setPage(1), [q, category, lowStockOnly, sort]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/products/${pendingDelete.productId}`);
      showSuccess(`Deleted "${pendingDelete.name}".`);
      setPendingDelete(null);
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function saveStock(product: Product) {
    const draft = stockDrafts[product.productId];
    if (draft === undefined) return;
    const stock = Number(draft);
    if (!Number.isInteger(stock) || stock < 0) {
      showError("Stock must be a whole number, 0 or more.");
      return;
    }
    setSavingStockFor(product.productId);
    try {
      await api.patch(`/api/admin/products/${product.productId}/stock`, { stock });
      showSuccess(`Updated stock for "${product.name}".`);
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[product.productId];
        return next;
      });
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update stock.");
    } finally {
      setSavingStockFor(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink/60">{result ? `${result.total} product(s)` : " "}</p>
        </div>
        <Link href="/admin/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search products…" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="stock_asc">Stock: low to high</option>
          <option value="stock_desc">Stock: high to low</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-line text-moss-700 focus:ring-moss-500"
          />
          Low stock only
        </label>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <LineSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try a different search or filter, or add your first product."
          action={
            <Link href="/admin/products/new">
              <Button size="sm">Add product</Button>
            </Link>
          }
        />
      ) : (
        <>
          <AdminTable>
            <AdminTableHead>
              <AdminTh>Product</AdminTh>
              <AdminTh>Category</AdminTh>
              <AdminTh>Price</AdminTh>
              <AdminTh>Stock</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminTableHead>
            <tbody>
              {result.items.map((product) => (
                <AdminTr key={product.productId}>
                  <AdminTd>
                    <div className="flex items-center gap-3">
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      )}
                      <Link href={`/admin/products/${product.productId}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  </AdminTd>
                  <AdminTd className="text-ink/60">{product.categoryName}</AdminTd>
                  <AdminTd>{formatPrice(product.priceCents, product.currency)}</AdminTd>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={stockDrafts[product.productId] ?? String(product.stock)}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({ ...prev, [product.productId]: e.target.value }))
                        }
                        className="w-16 rounded-md border border-line px-2 py-1 text-sm focus:border-ink focus:outline-none"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveStock(product)}
                        isLoading={savingStockFor === product.productId}
                        disabled={
                          stockDrafts[product.productId] === undefined ||
                          stockDrafts[product.productId] === String(product.stock)
                        }
                      >
                        Save
                      </Button>
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex flex-col gap-1">
                      <StockBadge stock={product.stock} />
                      {product.isFeatured && <Badge tone="neutral">Featured</Badge>}
                    </div>
                  </AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${product.productId}`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete(product)}>
                        Delete
                      </Button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This permanently removes the product from the catalog. This can't be undone."
        confirmLabel="Delete product"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
