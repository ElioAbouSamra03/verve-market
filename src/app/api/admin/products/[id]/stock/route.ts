import { requireAdminApi } from "@/lib/auth/adminSession";
import { setProductStock } from "@/lib/db/products";
import { updateStockSchema } from "@/lib/validation/adminSchemas";
import { ok, fail } from "@/lib/utils/apiResponse";

// PATCH /api/admin/products/:id/stock — { stock } quick inventory update
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    requireAdminApi();
    const body = await request.json();
    const { stock } = updateStockSchema.parse(body);
    const product = await setProductStock(params.id, stock);
    return ok(product);
  } catch (err) {
    return fail(err);
  }
}
