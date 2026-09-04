import { z } from "zod";

/**
 * All request bodies are validated at the API boundary with these schemas
 * before any business logic or database call runs. Route handlers call
 * `schema.parse(body)`; a ZodError bubbles up and is translated into a
 * 422 VALIDATION_ERROR response by lib/utils/apiResponse.ts.
 */

export const addToCartSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  variantId: z.string().min(1).optional(),
  quantity: z
    .number()
    .int("quantity must be a whole number")
    .min(1, "quantity must be at least 1")
    .max(50, "quantity cannot exceed 50 per line item"),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("quantity must be a whole number")
    .min(1, "quantity must be at least 1")
    .max(50, "quantity cannot exceed 50 per line item"),
});

export const addToWishlistSchema = z.object({
  productId: z.string().min(1, "productId is required"),
});

export const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(1, "Name is required").max(120),
});

export const productQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().max(200).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "rating"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).optional(),
});
