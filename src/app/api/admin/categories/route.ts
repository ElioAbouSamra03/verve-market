import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/adminSession";
import { getCategoryBySlug, listCategories, upsertCategory } from "@/lib/db/categories";
import { createCategorySchema } from "@/lib/validation/adminSchemas";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ok, created, fail } from "@/lib/utils/apiResponse";
import type { Category } from "@/types/category";

// GET /api/admin/categories
export async function GET() {
  try {
    requireAdminApi();
    const categories = await listCategories();
    return ok(categories);
  } catch (err) {
    return fail(err);
  }
}

// POST /api/admin/categories — create a category
export async function POST(request: NextRequest) {
  try {
    requireAdminApi();
    const body = await request.json();
    const input = createCategorySchema.parse(body);

    const slugTaken = await getCategoryBySlug(input.slug).then(
      () => true,
      (err) => {
        if (err instanceof NotFoundError) return false;
        throw err;
      }
    );
    if (slugTaken) {
      throw new ConflictError(`A category with slug "${input.slug}" already exists.`);
    }

    const now = new Date().toISOString();
    const category: Category = { ...input, productCount: 0, createdAt: now, updatedAt: now };
    const saved = await upsertCategory(category);
    return created(saved);
  } catch (err) {
    return fail(err);
  }
}
