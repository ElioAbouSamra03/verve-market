/**
 * Product domain types.
 *
 * DynamoDB table: verve_products
 * PK: PRODUCT#<productId>      SK: METADATA
 * GSI1 (by category): GSI1PK: CATEGORY#<categorySlug>   GSI1SK: PRODUCT#<productId>
 * GSI2 (by search keyword bucket is handled app-side; DynamoDB is not a search engine,
 *        see lib/db/products.ts for the scan+filter strategy and the note on OpenSearch
 *        as a production upgrade path).
 */

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  label: string; // e.g. "Small / Black"
  priceModifierCents: number; // added to base price
  stock: number;
}

export interface Product {
  productId: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  priceCents: number;
  compareAtPriceCents?: number; // for "on sale" strike-through pricing
  currency: string; // ISO 4217, e.g. "USD"
  categorySlug: string;
  categoryName: string;
  images: ProductImage[];
  tags: string[];
  stock: number;
  rating?: number;
  reviewCount?: number;
  variants?: ProductVariant[];
  isFeatured?: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

/** Shape returned to the client for list views — trimmed for payload size. */
export type ProductSummary = Pick<
  Product,
  | "productId"
  | "slug"
  | "name"
  | "shortDescription"
  | "priceCents"
  | "compareAtPriceCents"
  | "currency"
  | "categorySlug"
  | "categoryName"
  | "images"
  | "stock"
  | "rating"
  | "reviewCount"
  | "isFeatured"
>;

export interface ProductFilters {
  category?: string;
  q?: string; // search query
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
