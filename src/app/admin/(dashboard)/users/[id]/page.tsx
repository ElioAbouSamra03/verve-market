"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { TextField } from "@/components/admin/FormField";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";
import { Button } from "@/components/ui/Button";
import { LineSkeleton } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import type { User } from "@/types/user";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setError(null);
    try {
      const data = await api.get<User>(`/api/admin/users/${id}`);
      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setAvatarUrl(data.avatarUrl ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.patch<User>(`/api/admin/users/${id}`, {
        name,
        email,
        avatarUrl: avatarUrl || undefined,
      });
      setUser(updated);
      showSuccess("User updated.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/users/${id}`);
      showSuccess("User deleted.");
      router.push("/admin/users");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete user.");
      setIsDeleting(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">User details</h1>
          <p className="mt-1 text-sm text-ink/60">{user?.userId ?? "Loading…"}</p>
        </div>
        {user && (
          <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
            Delete user
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        {!user ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LineSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label="Avatar URL"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              hint="Optional"
            />
            <p className="text-xs text-ink/50">
              Joined {new Date(user.createdAt).toLocaleDateString()} · Last updated{" "}
              {new Date(user.updatedAt).toLocaleDateString()}
            </p>
            <div>
              <Button type="submit" isLoading={isSaving}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete ${user?.name}?`}
        description="This permanently deletes the account along with their cart and wishlist. This can't be undone."
        confirmLabel="Delete user"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
