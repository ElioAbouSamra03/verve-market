import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "./dynamoClient";
import { ConflictError, DatabaseError } from "@/lib/errors";
import { getProductById } from "./products";
import type { WishlistItem } from "@/types/wishlist";

const TABLE = TableNames.wishlist;

function itemKey(userId: string, productId: string) {
  return { PK: `USER#${userId}`, SK: `PRODUCT#${productId}` };
}

function fromDynamoItem(item: Record<string, unknown>): WishlistItem {
  const { PK, SK, entityType, ...rest } = item;
  return rest as unknown as WishlistItem;
}

export async function listWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${userId}` },
      })
    );
    return (result.Items ?? [])
      .map(fromDynamoItem)
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch (err) {
    throw new DatabaseError("Failed to load wishlist.", err);
  }
}

/**
 * Adds a product to the wishlist.
 *
 * Duplicate prevention is enforced with a conditional PutItem
 * (attribute_not_exists(PK)) rather than a "check then write" — this closes
 * the race condition a naive read-then-write approach would have under
 * concurrent requests (e.g. a double click, or two open tabs).
 */
export async function addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
  const product = await getProductById(productId);

  const item: WishlistItem = {
    userId,
    productId,
    productSnapshot: {
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? "",
      priceCents: product.priceCents,
      currency: product.currency,
      inStock: product.stock > 0,
    },
    addedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: { ...itemKey(userId, productId), entityType: "WISHLIST_ITEM", ...item },
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
    return item;
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      throw new ConflictError("This product is already in your wishlist.");
    }
    throw new DatabaseError("Failed to add item to wishlist.", err);
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: itemKey(userId, productId) }));
  } catch (err) {
    throw new DatabaseError("Failed to remove item from wishlist.", err);
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const all = await listWishlist(userId);
  return all.some((i) => i.productId === productId);
}

/** Removes every wishlist entry for a user — used when an admin deletes a
 *  user account, so no orphaned wishlist rows are left pointing at a
 *  userId that no longer exists. */
export async function clearWishlist(userId: string): Promise<void> {
  const items = await listWishlist(userId);
  await Promise.all(items.map((i) => removeFromWishlist(userId, i.productId)));
}

/**
 * Admin-only: every wishlist entry across every user, for the "Wishlist
 * Items" dashboard stat and the admin wishlist viewer. As with cart, each
 * table is per-entity, so a full Scan already spans every user.
 */
export async function listAllWishlistItems(): Promise<WishlistItem[]> {
  try {
    const items: WishlistItem[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey }));
      (result.Items ?? []).forEach((item) => items.push(fromDynamoItem(item)));
      ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);
    return items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch (err) {
    throw new DatabaseError("Failed to load wishlist items.", err);
  }
}
