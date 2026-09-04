import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/db/categories";
import { listProducts } from "@/lib/db/products";
import { NotFoundError } from "@/lib/errors";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: { slug: string };
}

// Avoid requiring DynamoDB access at build time; render per-request instead.
export const dynamic = "force-dynamic";

async function loadCategory(slug: string) {
  try {
    return await getCategoryBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await loadCategory(params.slug);
  if (!category) return { title: "Category not found — Verve Market" };
  return { title: `${category.name} — Verve Market`, description: category.description };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await loadCategory(params.slug);
  if (!category) notFound();

  const result = await listProducts({ category: category.slug, pageSize: 24 });

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-moss-700">Category</p>
        <h1 className="mt-2 font-display text-3xl text-ink">{category.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/60">{category.description}</p>
      </div>
      <ProductGrid products={result.items} />
    </div>
  );
}
