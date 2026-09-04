import { requireAdminApi } from "@/lib/auth/adminSession";
import {
  deleteProduct,
  getProductBySlug,
  getProductById,
  upsertProduct,
} from "@/lib/db/products";
import { getCategoryBySlug, syncCategoryProductCount } from "@/lib/db/categories";
import { updateProductSchema } from "@/lib/validation/adminSchemas";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ok, noContent, fail } from "@/lib/utils/apiResponse";
import type { Product } from "@/types/product";

// GET /api/admin/products/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const product = await getProductById(params.id);
    return ok(product);
  } catch (err) {
    return fail(err);
  }
}

// PATCH /api/admin/products/:id — partial update
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const body = await request.json();
    const input = updateProductSchema.parse(body);
    const existing = await getProductById(params.id);

    if (input.slug && input.slug !== existing.slug) {
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
    }

    const previousCategorySlug = existing.categorySlug;
    let categoryName = existing.categoryName;
    if (input.categorySlug && input.categorySlug !== existing.categorySlug) {
      const category = await getCategoryBySlug(input.categorySlug);
      categoryName = category.name;
    }

    const updated: Product = {
      ...existing,
      ...input,
      categoryName,
      productId: existing.productId,
      updatedAt: new Date().toISOString(),
    };

    const saved = await upsertProduct(updated);

    if (input.categorySlug && input.categorySlug !== previousCategorySlug) {
      await Promise.all([
        syncCategoryProductCount(previousCategorySlug),
        syncCategoryProductCount(input.categorySlug),
      ]);
    }

    return ok(saved);
  } catch (err) {
    return fail(err);
  }
}

// DELETE /api/admin/products/:id
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const existing = await getProductById(params.id);
    await deleteProduct(params.id);
    await syncCategoryProductCount(existing.categorySlug);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
