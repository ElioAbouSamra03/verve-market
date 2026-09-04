"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { CategoryForm, CategoryFormValues } from "@/components/admin/CategoryForm";
import { useToast } from "@/components/admin/ToastProvider";
import type { Category } from "@/types/category";

export default function NewCategoryPage() {
  const router = useRouter();
  const { showSuccess } = useToast();

  async function handleSubmit(values: CategoryFormValues) {
    const category = await api.post<Category>("/api/admin/categories", values);
    showSuccess(`"${category.name}" was created.`);
    router.push("/admin/categories");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Add category</h1>
      <p className="mt-1 text-sm text-ink/60">Create a new product category.</p>
      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <CategoryForm submitLabel="Create category" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
