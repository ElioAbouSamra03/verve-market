"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types/category";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

export function FilterSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  const activeCategory = searchParams.get("category");
  const activeSort = searchParams.get("sort") ?? "newest";

  return (
    <aside className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">Category</h3>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>
            <button
              onClick={() => updateParam("category", null)}
              className={`hover:text-ink ${!activeCategory ? "font-semibold text-ink" : "text-ink/60"}`}
            >
              All products
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <button
                onClick={() => updateParam("category", category.slug)}
                className={`hover:text-ink ${
                  activeCategory === category.slug ? "font-semibold text-ink" : "text-ink/60"
                }`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">Sort by</h3>
        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="mt-3 w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">Price range</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => updateParam("minPrice", e.target.value || null)}
            className="w-full rounded-md border border-line px-2 py-1.5 text-sm focus:border-ink focus:outline-none"
          />
          <span className="text-ink/40">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => updateParam("maxPrice", e.target.value || null)}
            className="w-full rounded-md border border-line px-2 py-1.5 text-sm focus:border-ink focus:outline-none"
          />
        </div>
      </div>
    </aside>
  );
}
