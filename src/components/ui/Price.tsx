import { formatPrice } from "@/lib/utils/format";

export function Price({
  cents,
  compareAtCents,
  currency = "USD",
  size = "md",
}: {
  cents: number;
  compareAtCents?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const onSale = typeof compareAtCents === "number" && compareAtCents > cents;

  return (
    <span className="inline-flex items-baseline gap-2 font-mono">
      <span className={`${sizeClass} font-medium text-ink`}>{formatPrice(cents, currency)}</span>
      {onSale && (
        <span className="text-xs text-ink/40 line-through">
          {formatPrice(compareAtCents!, currency)}
        </span>
      )}
    </span>
  );
}

export function RatingStars({ rating = 0, reviewCount }: { rating?: number; reviewCount?: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1 text-xs text-ink/60">
      <span aria-hidden className="text-moss-700">
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
      {typeof reviewCount === "number" && <span>({reviewCount})</span>}
    </div>
  );
}
