import { removeFromWishlist } from "@/lib/db/wishlist";
import { getOrCreateUserId } from "@/lib/utils/session";
import { noContent, fail } from "@/lib/utils/apiResponse";

// DELETE /api/wishlist/:productId
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = getOrCreateUserId();
    await removeFromWishlist(userId, params.id);
    return noContent();
  } catch (err) {
    return fail(err);
  }
}
