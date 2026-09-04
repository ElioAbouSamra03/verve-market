import { ProductCard } from "./ProductCard";
import type { ProductSummary } from "@/types/product";

export function RelatedProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl text-ink">You might also like</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    </section>
  );
}
