import { requireAdminApi } from "@/lib/auth/adminSession";
import { listAllCartItems } from "@/lib/db/cart";
import { ok, fail } from "@/lib/utils/apiResponse";
import type { AdminCartItemRow } from "@/types/admin";

// GET /api/admin/cart — every cart line item, across every user
export async function GET() {
  try {
    requireAdminApi();
    const items = await listAllCartItems();
    const rows: AdminCartItemRow[] = items.map((item) => ({
      ...item,
      lineTotalCents: item.quantity * item.productSnapshot.unitPriceCents,
    }));
    return ok(rows);
  } catch (err) {
    return fail(err);
  }
}
