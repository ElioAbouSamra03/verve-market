export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function clampPage(page: number | undefined, fallback = 1): number {
  if (!page || Number.isNaN(page) || page < 1) return fallback;
  return Math.floor(page);
}
