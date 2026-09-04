"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { LineSkeleton } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminTable, AdminTableHead, AdminTh, AdminTr, AdminTd } from "@/components/admin/AdminTable";
import { Badge } from "@/components/admin/Badge";
import type { Category } from "@/types/category";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  async function load() {
    setError(null);
    try {
      const data = await api.get<Category[]>("/api/admin/categories");
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/categories/${pendingDelete.slug}`);
      showSuccess(`Deleted "${pendingDelete.name}".`);
      setPendingDelete(null);
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink/60">{categories ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"}` : " "}</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>Add category</Button>
        </Link>
      </div>

      {!categories && !error ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <LineSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : categories!.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Products need a category — create one to get started."
          action={
            <Link href="/admin/categories/new">
              <Button size="sm">Add category</Button>
            </Link>
          }
        />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <AdminTh>Category</AdminTh>
            <AdminTh>Slug</AdminTh>
            <AdminTh>Products</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminTableHead>
          <tbody>
            {categories!.map((category) => (
              <AdminTr key={category.slug}>
                <AdminTd>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={category.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </AdminTd>
                <AdminTd className="text-ink/60">{category.slug}</AdminTd>
                <AdminTd>{category.productCount}</AdminTd>
                <AdminTd>{category.featured && <Badge tone="neutral">Featured</Badge>}</AdminTd>
                <AdminTd className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/categories/${category.slug}`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => setPendingDelete(category)}>
                      Delete
                    </Button>
                  </div>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description={
          pendingDelete && pendingDelete.productCount > 0
            ? `This category has ${pendingDelete.productCount} product(s) assigned — deletion will be blocked until they're reassigned or removed.`
            : "This can't be undone."
        }
        confirmLabel="Delete category"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
