import { requireAdminApi } from "@/lib/auth/adminSession";
import { listAllWishlistItems } from "@/lib/db/wishlist";
import { ok, fail } from "@/lib/utils/apiResponse";

// GET /api/admin/wishlist — every wishlist entry, across every user
export async function GET() {
  try {
    requireAdminApi();
    const items = await listAllWishlistItems();
    return ok(items);
  } catch (err) {
    return fail(err);
  }
}
