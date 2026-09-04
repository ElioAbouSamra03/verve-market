import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/db/products";
import { NotFoundError } from "@/lib/errors";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Price, RatingStars } from "@/components/ui/Price";
import type { Metadata } from "next";

interface ProductPageProps {
  params: { id: string }; // the URL segment is the product's slug
}

// Avoid requiring DynamoDB access at build time; render per-request instead
// so stock and pricing are always current.
export const dynamic = "force-dynamic";

async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProduct(params.id);
  if (!product) return { title: "Product not found — Verve Market" };
  return {
    title: `${product.name} — Verve Market`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await loadProduct(params.id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div>
      <nav className="mb-6 text-xs text-ink/50">
        <span>{product.categoryName}</span>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-sand">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-sand">
                  <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl text-ink">{product.name}</h1>
          {typeof product.rating === "number" && (
            <div className="mt-2">
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
            </div>
          )}
          <div className="mt-4">
            <Price
              cents={product.priceCents}
              compareAtCents={product.compareAtPriceCents}
              currency={product.currency}
              size="lg"
            />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-8">
            <AddToCartForm product={product} />
          </div>

          {product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}
