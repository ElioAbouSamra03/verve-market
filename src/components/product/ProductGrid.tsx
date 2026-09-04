import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductSummary } from "@/types/product";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="No products match your search"
        description="Try a different keyword, or clear your filters to see the full catalog."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} />
      ))}
    </div>
  );
}
