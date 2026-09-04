"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { CategoryForm, CategoryFormValues } from "@/components/admin/CategoryForm";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import { Button } from "@/components/ui/Button";
import { LineSkeleton } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import type { Category } from "@/types/category";

export default function EditCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setError(null);
    try {
      setCategory(await api.get<Category>(`/api/admin/categories/${slug}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSubmit(values: CategoryFormValues) {
    const { slug: _slug, ...rest } = values;
    const updated = await api.patch<Category>(`/api/admin/categories/${slug}`, rest);
    showSuccess(`"${updated.name}" was updated.`);
    router.push("/admin/categories");
  }

  async function handleDelete() {
    if (!category) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/categories/${category.slug}`);
      showSuccess(`Deleted "${category.name}".`);
      router.push("/admin/categories");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete category.");
      setIsDeleting(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Edit category</h1>
          <p className="mt-1 text-sm text-ink/60">{category?.name ?? "Loading…"}</p>
        </div>
        {category && (
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            Delete category
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        {!category ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LineSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <CategoryForm initialCategory={category} submitLabel="Save changes" onSubmit={handleSubmit} />
        )}
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete "${category?.name}"?`}
        description={
          category && category.productCount > 0
            ? `This category has ${category.productCount} product(s) assigned — deletion will be blocked until they're reassigned or removed.`
            : "This can't be undone."
        }
        confirmLabel="Delete category"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
