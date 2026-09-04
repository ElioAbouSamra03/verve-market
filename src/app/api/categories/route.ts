import { listCategories } from "@/lib/db/categories";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/categories
export async function GET() {
  try {
    const categories = await listCategories();
    return ok(categories);
  } catch (err) {
    return fail(err);
  }
}
