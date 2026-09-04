import { requireAdminApi } from "@/lib/auth/adminSession";
import { deleteCategory, getCategoryBySlug, updateCategory } from "@/lib/db/categories";
import { updateCategorySchema } from "@/lib/validation/adminSchemas";
import { ok, noContent, fail } from "@/lib/utils/apiResponse";

// GET /api/admin/categories/:slug
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    requireAdminApi();
    const category = await getCategoryBySlug(params.slug);
    return ok(category);
  } catch (err) {
    return fail(err);
  }
}

// PATCH /api/admin/categories/:slug — partial update (name/description/image/featured)
export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  try {
    requireAdminApi();
    const body = await request.json();
    const input = updateCategorySchema.parse(body);
    const updated = await updateCategory(params.slug, input);
    return ok(updated);
  } catch (err) {
    return fail(err);
  }
}

// DELETE /api/admin/categories/:slug — 409 if products still reference it
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  try {
    requireAdminApi();
    await deleteCategory(params.slug);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
