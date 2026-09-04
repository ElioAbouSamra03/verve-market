import Link from "next/link";
import Image from "next/image";
import { getFeaturedProducts } from "@/lib/db/products";
import { listCategories } from "@/lib/db/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";

// Product/category data changes independently of deploys (stock, pricing,
// featured flags), and this page shouldn't require DynamoDB to be reachable
// at build time — render it per-request instead of trying to prerender it.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(8), listCategories()]);

  return (
    <div className="space-y-20">
      <section className="grid gap-8 py-8 md:grid-cols-2 md:items-center md:py-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-moss-700">
            New season catalog
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Goods built for the long haul, not the landfill.
          </h1>
          <p className="mt-5 max-w-md text-ink/60">
            Verve Market curates durable home, kitchen, and apparel essentials from makers who
            design for repair, not replacement.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/products">
              <Button size="lg">Shop the catalog</Button>
            </Link>
            <Link href="/categories/home">
              <Button size="lg" variant="secondary">
                Explore Home
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand">
          <Image
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80"
            alt="A neatly arranged still life of ceramic homeware"
            fill
            priority
            className="object-cover"
          />
        </div>
      </section>

      {categories.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-ink">Shop by category</h2>
            <Link href="/products" className="text-sm text-ink/60 hover:text-ink">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group relative aspect-square overflow-hidden rounded-md bg-sand"
              >
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-sm font-medium text-white">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Featured products</h2>
          <Link href="/products" className="text-sm text-ink/60 hover:text-ink">
            View all
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={featured} />
        </div>
      </section>
    </div>
  );
}
