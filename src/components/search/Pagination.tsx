"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/products?${params.toString()}`);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink disabled:opacity-30"
      >
        Previous
      </button>
      <span className="px-3 text-sm text-ink/60">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink disabled:opacity-30"
      >
        Next
      </button>
    </nav>
  );
}
