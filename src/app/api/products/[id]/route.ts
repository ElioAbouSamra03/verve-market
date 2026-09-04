import { getProductById, getRelatedProducts } from "@/lib/db/products";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/products/:id — id may be a productId; product detail pages resolve
// by slug server-side (see app/products/[id]/page.tsx) and call this by id.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await getProductById(params.id);
    const related = await getRelatedProducts(product);
    return ok({ product, related });
  } catch (err) {
    return fail(err);
  }
}
