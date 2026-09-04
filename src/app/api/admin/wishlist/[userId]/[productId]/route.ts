import { requireAdminApi } from "@/lib/auth/adminSession";
import { removeFromWishlist } from "@/lib/db/wishlist";
import { noContent, fail } from "@/lib/utils/apiResponse";

// DELETE /api/admin/wishlist/:userId/:productId — remove one wishlist entry
export async function DELETE(
  _request: Request,
  { params }: { params: { userId: string; productId: string } }
) {
  try {
    requireAdminApi();
    await removeFromWishlist(params.userId, params.productId);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
