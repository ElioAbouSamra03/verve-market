/**
 * Wishlist domain types.
 *
 * DynamoDB table: verve_wishlist
 * PK: USER#<userId>   SK: PRODUCT#<productId>
 *
 * A conditional PutItem (attribute_not_exists(PK)) enforces "no duplicate
 * wishlist entries" at the database layer, not just in application code.
 */

export interface WishlistItem {
  userId: string;
  productId: string;
  productSnapshot: {
    name: string;
    slug: string;
    image: string;
    priceCents: number;
    currency: string;
    inStock: boolean;
  };
  addedAt: string;
}
