import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/adminSession";
import {
  getProductBySlug,
  listProductsAdmin,
  upsertProduct,
} from "@/lib/db/products";
import { getCategoryBySlug, syncCategoryProductCount } from "@/lib/db/categories";
import { adminProductQuerySchema, createProductSchema } from "@/lib/validation/adminSchemas";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ok, created, fail } from "@/lib/utils/apiResponse";
import type { Product } from "@/types/product";

// GET /api/admin/products?category=&q=&lowStockOnly=&sort=&page=&pageSize=
export async function GET(request: NextRequest) {
  try {
    requireAdminApi();
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = adminProductQuerySchema.parse(params);
    const result = await listProductsAdmin(filters);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}

// POST /api/admin/products — create a product
export async function POST(request: NextRequest) {
  try {
    requireAdminApi();
    const body = await request.json();
    const input = createProductSchema.parse(body);

    // Slug must be unique across the catalog (it's used in storefront URLs).
    const slugTaken = await getProductBySlug(input.slug).then(
      () => true,
      (err) => {
        if (err instanceof NotFoundError) return false;
        throw err;
      }
    );
    if (slugTaken) {
      throw new ConflictError(`A product with slug "${input.slug}" already exists.`);
    }

    // Category must exist; denormalize its current display name onto the product.
    const category = await getCategoryBySlug(input.categorySlug);

    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      productId: randomUUID(),
      categoryName: category.name,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await upsertProduct(product);
    await syncCategoryProductCount(category.slug);
    return created(saved);
  } catch (err) {
    return fail(err);
  }
}
