import { listProducts } from "@/lib/db/products";
import { listCategories } from "@/lib/db/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { Pagination } from "@/components/search/Pagination";
import { clampPage } from "@/lib/utils/format";

interface ProductsPageProps {
  searchParams: {
    category?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: "price_asc" | "price_desc" | "newest" | "rating";
    page?: string;
  };
}

// Search/filter/sort/pagination all depend on request-time query params and
// live stock levels, so this page is always rendered per-request.
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const filters = {
    category: searchParams.category,
    q: searchParams.q,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort: searchParams.sort ?? "newest",
    page: clampPage(searchParams.page ? Number(searchParams.page) : undefined),
    pageSize: 12,
  };

  const [result, categories] = await Promise.all([listProducts(filters), listCategories()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">
          {searchParams.q ? `Results for "${searchParams.q}"` : "All products"}
        </h1>
        <p className="mt-1 text-sm text-ink/50">
          {result.total} {result.total === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <FilterSidebar categories={categories} />
        <div>
          <ProductGrid products={result.items} />
          <Pagination page={result.page} totalPages={result.totalPages} />
        </div>
      </div>
    </div>
  );
}
