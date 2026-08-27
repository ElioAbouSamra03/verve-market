export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square w-full rounded-md bg-sand" />
          <div className="mt-3 h-3.5 w-3/4 rounded bg-sand" />
          <div className="mt-2 h-3.5 w-1/3 rounded bg-sand" />
        </div>
      ))}
    </div>
  );
}

export function LineSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-sand ${className}`} />;
}
