"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { LineSkeleton } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SearchInput } from "@/components/admin/SearchInput";
import { useToast } from "@/components/admin/ToastProvider";
import { AdminTable, AdminTableHead, AdminTh, AdminTr, AdminTd } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/format";
import type { AdminCartItemRow } from "@/types/admin";

export default function AdminCartPage() {
  const [items, setItems] = useState<AdminCartItemRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminCartItemRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  async function load() {
    setError(null);
    try {
      setItems(await api.get<AdminCartItemRow[]>("/api/admin/cart"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart items.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const needle = q.toLowerCase().trim();
    if (!needle) return items;
    return items.filter(
      (i) => i.userId.toLowerCase().includes(needle) || i.productSnapshot.name.toLowerCase().includes(needle)
    );
  }, [items, q]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const params = pendingDelete.variantId ? `?variantId=${encodeURIComponent(pendingDelete.variantId)}` : "";
      await api.delete(`/api/admin/cart/${pendingDelete.userId}/${pendingDelete.productId}${params}`);
      showSuccess("Cart item removed.");
      setPendingDelete(null);
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to remove cart item.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Cart</h1>
        <p className="mt-1 text-sm text-ink/60">
          {items ? `${items.length} line item(s) across all users` : " "}
        </p>
      </div>

      <SearchInput value={q} onChange={setQ} placeholder="Search by user ID or product…" />

      {!items && !error ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <LineSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No cart items" description="No one has anything in their cart right now." />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <AdminTh>User</AdminTh>
            <AdminTh>Product</AdminTh>
            <AdminTh>Qty</AdminTh>
            <AdminTh>Unit price</AdminTh>
            <AdminTh>Line total</AdminTh>
            <AdminTh>Updated</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminTableHead>
          <tbody>
            {filtered.map((item) => (
              <AdminTr key={`${item.userId}-${item.productId}-${item.variantId ?? "base"}`}>
                <AdminTd className="max-w-[160px] truncate text-ink/60" title={item.userId}>
                  {item.userId}
                </AdminTd>
                <AdminTd>
                  {item.productSnapshot.name}
                  {item.productSnapshot.variantLabel && (
                    <span className="text-ink/50"> · {item.productSnapshot.variantLabel}</span>
                  )}
                </AdminTd>
                <AdminTd>{item.quantity}</AdminTd>
                <AdminTd>{formatPrice(item.productSnapshot.unitPriceCents, item.productSnapshot.currency)}</AdminTd>
                <AdminTd>{formatPrice(item.lineTotalCents, item.productSnapshot.currency)}</AdminTd>
                <AdminTd className="text-ink/60">{new Date(item.updatedAt).toLocaleDateString()}</AdminTd>
                <AdminTd className="text-right">
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(item)}>
                    Remove
                  </Button>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this cart item?"
        description={
          pendingDelete
            ? `Removes "${pendingDelete.productSnapshot.name}" from this user's cart.`
            : undefined
        }
        confirmLabel="Remove"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
