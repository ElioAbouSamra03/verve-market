interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Generic, callback-driven pagination for admin tables (the storefront's
 *  Pagination component is hard-wired to the /products route, so this is a
 *  separate reusable one shared across every admin list screen). */
export function AdminPagination({ page, totalPages, total, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
      <p className="text-xs text-ink/50">{total} total</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink disabled:opacity-30"
        >
          Previous
        </button>
        <span className="px-2 text-sm text-ink/60">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-ink disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
