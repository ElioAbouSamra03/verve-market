import { NextRequest } from "next/server";
import { addToWishlist, listWishlist } from "@/lib/db/wishlist";
import { addToWishlistSchema } from "@/lib/validation/schemas";
import { getOrCreateUserId } from "@/lib/utils/session";
import { ok, created, fail } from "@/lib/utils/apiResponse";

// GET /api/wishlist
export async function GET() {
  try {
    const userId = getOrCreateUserId();
    const items = await listWishlist(userId);
    return ok(items);
  } catch (err) {
    return fail(err);
  }
}

// POST /api/wishlist — add a product; rejects duplicates with 409 CONFLICT
export async function POST(request: NextRequest) {
  try {
    const userId = getOrCreateUserId();
    const body = await request.json();
    const { productId } = addToWishlistSchema.parse(body);
    const item = await addToWishlist(userId, productId);
    return created(item);
  } catch (err) {
    return fail(err);
  }
}
