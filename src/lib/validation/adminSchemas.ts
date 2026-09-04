import { z } from "zod";

/**
 * Zod schemas for the admin dashboard's mutating endpoints. Same pattern as
 * lib/validation/schemas.ts: route handlers call `schema.parse(...)` and a
 * thrown ZodError is turned into a 422 VALIDATION_ERROR by apiResponse.fail().
 */

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const productImageSchema = z.object({
  url: z.string().url("Enter a valid image URL"),
  alt: z.string().min(1, "Alt text is required").max(200),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  shortDescription: z.string().min(1, "Short description is required").max(280),
  description: z.string().min(1, "Description is required").max(5000),
  priceCents: z.number().int().min(0, "Price cannot be negative"),
  compareAtPriceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3, "Use a 3-letter ISO currency code").default("USD"),
  categorySlug: z.string().min(1, "Category is required"),
  images: z.array(productImageSchema).min(1, "At least one image is required"),
  tags: z.array(z.string().min(1)).default([]),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

export const adminProductQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().max(200).optional(),
  lowStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "name_asc", "price_asc", "price_desc", "stock_asc", "stock_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  description: z.string().min(1, "Description is required").max(2000),
  imageUrl: z.string().url("Enter a valid image URL"),
  featured: z.boolean().default(false),
});

export const updateCategorySchema = createCategorySchema.omit({ slug: true }).partial();

export const adminUserQuerySchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).optional(),
  email: z.string().email("Enter a valid email address").optional(),
  avatarUrl: z.string().url("Enter a valid image URL").optional(),
});
