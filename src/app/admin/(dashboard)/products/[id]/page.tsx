"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import { Button } from "@/components/ui/Button";
import { LineSkeleton } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setError(null);
    try {
      const [p, c] = await Promise.all([
        api.get<Product>(`/api/admin/products/${id}`),
        api.get<Category[]>("/api/admin/categories"),
      ]);
      setProduct(p);
      setCategories(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(values: ProductFormValues) {
    const updated = await api.patch<Product>(`/api/admin/products/${id}`, values);
    showSuccess(`"${updated.name}" was updated.`);
    router.push("/admin/products");
  }

  async function handleDelete() {
    if (!product) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/products/${product.productId}`);
      showSuccess(`Deleted "${product.name}".`);
      router.push("/admin/products");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete product.");
      setIsDeleting(false);
    }
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Edit product</h1>
          <p className="mt-1 text-sm text-ink/60">{product?.name ?? "Loading…"}</p>
        </div>
        {product && (
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            Delete product
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        {!product || !categories ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LineSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ProductForm
            categories={categories}
            initialProduct={product}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete "${product?.name}"?`}
        description="This permanently removes the product from the catalog. This can't be undone."
        confirmLabel="Delete product"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
