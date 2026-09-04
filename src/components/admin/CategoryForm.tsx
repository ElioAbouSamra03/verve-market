"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/ToastProvider";
import { slugify } from "@/lib/utils/format";
import type { Category } from "@/types/category";

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  featured: boolean;
}

interface CategoryFormProps {
  initialCategory?: Category;
  submitLabel: string;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryForm({ initialCategory, submitLabel, onSubmit }: CategoryFormProps) {
  const router = useRouter();
  const { showError } = useToast();
  const isEdit = Boolean(initialCategory);

  const [name, setName] = useState(initialCategory?.name ?? "");
  const [slug, setSlug] = useState(initialCategory?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(initialCategory?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialCategory?.imageUrl ?? "");
  const [featured, setFeatured] = useState(initialCategory?.featured ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, slug, description, imageUrl, featured });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
        <TextField
          label="Slug"
          required
          disabled={isEdit}
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          hint={isEdit ? "Slugs can't be changed after creation." : "Used in the storefront URL."}
        />
      </div>
      <TextAreaField label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextField
        label="Image URL"
        type="url"
        required
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <CheckboxField label="Feature on homepage" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/categories")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
