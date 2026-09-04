"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { LineSkeleton } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchInput } from "@/components/admin/SearchInput";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable, AdminTableHead, AdminTh, AdminTr, AdminTd } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import type { User } from "@/types/user";
import type { PaginatedResult } from "@/types/product";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResult<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    return params.toString();
  }, [q, page]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await api.get<PaginatedResult<User>>(`/api/admin/users?${query}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => setPage(1), [q]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Users</h1>
        <p className="mt-1 text-sm text-ink/60">{result ? `${result.total} account(s)` : " "}</p>
      </div>

      <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <LineSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search." />
      ) : (
        <>
          <AdminTable>
            <AdminTableHead>
              <AdminTh>Name</AdminTh>
              <AdminTh>Email</AdminTh>
              <AdminTh>Joined</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminTableHead>
            <tbody>
              {result.items.map((user) => (
                <AdminTr key={user.userId}>
                  <AdminTd className="font-medium">{user.name}</AdminTd>
                  <AdminTd className="text-ink/60">{user.email}</AdminTd>
                  <AdminTd className="text-ink/60">{new Date(user.createdAt).toLocaleDateString()}</AdminTd>
                  <AdminTd className="text-right">
                    <Link href={`/admin/users/${user.userId}`}>
                      <Button variant="secondary" size="sm">
                        View / edit
                      </Button>
                    </Link>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
