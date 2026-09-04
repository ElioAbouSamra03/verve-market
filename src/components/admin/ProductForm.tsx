"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/ToastProvider";
import { slugify } from "@/lib/utils/format";
import type { Product, ProductImage } from "@/types/product";
import type { Category } from "@/types/category";

export interface ProductFormValues {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  compareAtPriceCents?: number;
  currency: string;
  categorySlug: string;
  images: ProductImage[];
  tags: string[];
  stock: number;
  isFeatured: boolean;
}

interface ProductFormProps {
  categories: Category[];
  initialProduct?: Product;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

function toDollars(cents: number | undefined): string {
  return cents === undefined ? "" : (cents / 100).toFixed(2);
}

/** Shared create/edit form — one place to keep field list, layout, and
 *  validation in sync instead of duplicating a large form per page. */
export function ProductForm({ categories, initialProduct, submitLabel, onSubmit }: ProductFormProps) {
  const router = useRouter();
  const { showError } = useToast();

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct));
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [price, setPrice] = useState(toDollars(initialProduct?.priceCents ?? 0));
  const [compareAtPrice, setCompareAtPrice] = useState(toDollars(initialProduct?.compareAtPriceCents));
  const [currency, setCurrency] = useState(initialProduct?.currency ?? "USD");
  const [categorySlug, setCategorySlug] = useState(initialProduct?.categorySlug ?? categories[0]?.slug ?? "");
  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images ?? [{ url: "", alt: "" }]
  );
  const [tagsInput, setTagsInput] = useState((initialProduct?.tags ?? []).join(", "));
  const [stock, setStock] = useState(String(initialProduct?.stock ?? 0));
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function updateImage(index: number, field: keyof ProductImage, value: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, [field]: value } : img)));
  }

  function addImageRow() {
    setImages((prev) => [...prev, { url: "", alt: "" }]);
  }

  function removeImageRow(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const validImages = images.filter((img) => img.url.trim() && img.alt.trim());
    if (validImages.length === 0) {
      showError("At least one image (URL + alt text) is required.");
      return;
    }
    if (!categorySlug) {
      showError("Choose a category.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        slug,
        shortDescription,
        description,
        priceCents: Math.round(Number(price) * 100),
        compareAtPriceCents: compareAtPrice ? Math.round(Number(compareAtPrice) * 100) : undefined,
        currency: currency.toUpperCase(),
        categorySlug,
        images: validImages,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        stock: Number(stock),
        isFeatured,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
        <TextField
          label="Slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          hint="Used in the storefront URL — lowercase, hyphen-separated."
        />
      </div>

      <TextField
        label="Short description"
        required
        maxLength={280}
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
        hint="Shown on product cards and listings."
      />

      <TextAreaField
        label="Description"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          label="Price (USD)"
          type="number"
          min={0}
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField
          label="Compare-at price"
          type="number"
          min={0}
          step="0.01"
          value={compareAtPrice}
          onChange={(e) => setCompareAtPrice(e.target.value)}
          hint="Optional — shown as a strike-through."
        />
        <TextField
          label="Stock"
          type="number"
          min={0}
          required
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Category" required value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
          {categories.length === 0 && <option value="">No categories yet — create one first</option>}
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          hint="Comma-separated, e.g. cotton, summer, best-seller"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-ink">Images</label>
          <Button type="button" variant="ghost" size="sm" onClick={addImageRow}>
            + Add image
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={img.url}
                onChange={(e) => updateImage(i, "url", e.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              <input
                value={img.alt}
                onChange={(e) => updateImage(i, "alt", e.target.value)}
                placeholder="Alt text"
                className="w-40 rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              {images.length > 1 && (
                <Button type="button" variant="danger" size="sm" onClick={() => removeImageRow(i)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <CheckboxField label="Feature on homepage" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
