import {
  DeleteCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "./dynamoClient";
import { DatabaseError, NotFoundError, OutOfStockError } from "@/lib/errors";
import { getProductById } from "./products";
import type { AddToCartInput, CartItem, CartSummary } from "@/types/cart";

const TABLE = TableNames.cart;

function lineItemKey(userId: string, productId: string, variantId?: string) {
  return { PK: `USER#${userId}`, SK: `ITEM#${productId}#${variantId ?? "base"}` };
}

function fromDynamoItem(item: Record<string, unknown>): CartItem {
  const { PK, SK, entityType, ...rest } = item;
  return rest as unknown as CartItem;
}

/**
 * Adds a product to the user's cart.
 *
 * Business rules enforced here:
 *  - the product must exist and have enough stock for the requested quantity
 *  - adding a product already in the cart increases its quantity instead of
 *    creating a duplicate line item (no duplicate SKUs in the same cart)
 *  - the final quantity can never exceed available stock
 */
export async function addToCart(userId: string, input: AddToCartInput): Promise<CartItem> {
  const product = await getProductById(input.productId);

  const variant = input.variantId
    ? product.variants?.find((v) => v.id === input.variantId)
    : undefined;
  if (input.variantId && !variant) {
    throw new NotFoundError("Product variant", input.variantId);
  }

  const availableStock = variant ? variant.stock : product.stock;
  const existing = await getCartItem(userId, input.productId, input.variantId);
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

  if (nextQuantity > availableStock) {
    throw new OutOfStockError(product.name, availableStock);
  }

  const unitPriceCents = product.priceCents + (variant?.priceModifierCents ?? 0);
  const now = new Date().toISOString();

  const item: CartItem = {
    userId,
    productId: input.productId,
    variantId: input.variantId,
    quantity: nextQuantity,
    productSnapshot: {
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? "",
      unitPriceCents,
      currency: product.currency,
      variantLabel: variant?.label,
    },
    addedAt: existing?.addedAt ?? now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...lineItemKey(userId, input.productId, input.variantId),
          entityType: "CART_ITEM",
          ...item,
        },
      })
    );
    return item;
  } catch (err) {
    throw new DatabaseError("Failed to add item to cart.", err);
  }
}

export async function getCartItem(
  userId: string,
  productId: string,
  variantId?: string
): Promise<CartItem | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": `ITEM#${productId}#${variantId ?? "base"}`,
        },
      })
    );
    const item = result.Items?.[0];
    return item ? fromDynamoItem(item) : null;
  } catch (err) {
    throw new DatabaseError("Failed to look up cart item.", err);
  }
}

export async function getCart(userId: string): Promise<CartSummary> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `USER#${userId}` },
      })
    );
    const items = (result.Items ?? []).map(fromDynamoItem);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce(
      (sum, i) => sum + i.quantity * i.productSnapshot.unitPriceCents,
      0
    );
    const currency = items[0]?.productSnapshot.currency ?? "USD";
    return { items, itemCount, subtotalCents, currency };
  } catch (err) {
    throw new DatabaseError("Failed to load cart.", err);
  }
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  variantId: string | undefined,
  quantity: number
): Promise<CartItem> {
  const existing = await getCartItem(userId, productId, variantId);
  if (!existing) throw new NotFoundError("Cart item", productId);

  const product = await getProductById(productId);
  const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined;
  const availableStock = variant ? variant.stock : product.stock;

  if (quantity > availableStock) {
    throw new OutOfStockError(product.name, availableStock);
  }

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: lineItemKey(userId, productId, variantId),
        UpdateExpression: "SET quantity = :qty, updatedAt = :now",
        ExpressionAttributeValues: {
          ":qty": quantity,
          ":now": new Date().toISOString(),
        },
        ConditionExpression: "attribute_exists(PK)",
        ReturnValues: "ALL_NEW",
      })
    );
    return fromDynamoItem(result.Attributes as Record<string, unknown>);
  } catch (err) {
    throw new DatabaseError("Failed to update cart item quantity.", err);
  }
}

export async function removeCartItem(
  userId: string,
  productId: string,
  variantId?: string
): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({ TableName: TABLE, Key: lineItemKey(userId, productId, variantId) })
    );
  } catch (err) {
    throw new DatabaseError("Failed to remove cart item.", err);
  }
}

export async function clearCart(userId: string): Promise<void> {
  const { items } = await getCart(userId);
  await Promise.all(items.map((i) => removeCartItem(userId, i.productId, i.variantId)));
}

/**
 * Admin-only: every cart line item across every user, for the "Cart Items"
 * dashboard stat and the admin cart viewer. Each table in this schema is
 * per-entity (not a shared single table), so a full-table Scan here already
 * returns every user's cart contents — no cross-partition query needed.
 */
export async function listAllCartItems(): Promise<CartItem[]> {
  try {
    const items: CartItem[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey }));
      (result.Items ?? []).forEach((item) => items.push(fromDynamoItem(item)));
      ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);
    return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    throw new DatabaseError("Failed to load cart items.", err);
  }
}
