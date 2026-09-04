"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { ProductForm, ProductFormValues } from "@/components/admin/ProductForm";
import { useToast } from "@/components/admin/ToastProvider";
import { LineSkeleton } from "@/components/ui/Loading";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export default function NewProductPage() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    api.get<Category[]>("/api/admin/categories").then(setCategories);
  }, []);

  async function handleSubmit(values: ProductFormValues) {
    const product = await api.post<Product>("/api/admin/products", values);
    showSuccess(`"${product.name}" was created.`);
    router.push("/admin/products");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-ink">Add product</h1>
      <p className="mt-1 text-sm text-ink/60">Create a new product in the catalog.</p>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        {categories === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LineSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ProductForm categories={categories} submitLabel="Create product" onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
