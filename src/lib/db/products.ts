import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "./dynamoClient";
import { DatabaseError, NotFoundError } from "@/lib/errors";
import type { PaginatedResult, Product, ProductFilters, ProductSummary } from "@/types/product";

const TABLE = TableNames.products;

function toItemKey(productId: string) {
  return { PK: `PRODUCT#${productId}`, SK: "METADATA" };
}

function toDynamoItem(product: Product) {
  return {
    ...toItemKey(product.productId),
    GSI1PK: `CATEGORY#${product.categorySlug}`,
    GSI1SK: `PRODUCT#${product.productId}`,
    entityType: "PRODUCT",
    ...product,
  };
}

function fromDynamoItem(item: Record<string, unknown>): Product {
  // Strip DynamoDB-only key attributes before handing the item back to the app.
  const { PK, SK, GSI1PK, GSI1SK, entityType, ...product } = item as Record<string, unknown>;
  return product as unknown as Product;
}

function toSummary(product: Product): ProductSummary {
  const {
    productId,
    slug,
    name,
    shortDescription,
    priceCents,
    compareAtPriceCents,
    currency,
    categorySlug,
    categoryName,
    images,
    stock,
    rating,
    reviewCount,
    isFeatured,
  } = product;
  return {
    productId,
    slug,
    name,
    shortDescription,
    priceCents,
    compareAtPriceCents,
    currency,
    categorySlug,
    categoryName,
    images,
    stock,
    rating,
    reviewCount,
    isFeatured,
  };
}

/**
 * Fetch every product in the catalog.
 *
 * DynamoDB has no native "search + filter + sort + paginate" query, so for a
 * catalog of this scale we Scan once and do search/filter/sort/pagination in
 * memory (see `listProducts` below). At real production scale you'd instead:
 *   1) keep the GSI1 (category) index for the common "browse by category" path,
 *   2) stream table changes (DynamoDB Streams) into OpenSearch/Algolia for the
 *      free-text search + faceted filtering path.
 * That split is called out explicitly so it's clear this is a deliberate,
 * documented trade-off rather than an oversight.
 */
async function scanAllProducts(): Promise<Product[]> {
  try {
    const items: Product[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
      );
      (result.Items ?? []).forEach((item) => items.push(fromDynamoItem(item)));
      ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);

    return items;
  } catch (err) {
    throw new DatabaseError("Failed to load products.", err);
  }
}

async function queryByCategory(categorySlug: string): Promise<Product[]> {
  try {
    const items: Product[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :pk",
          ExpressionAttributeValues: { ":pk": `CATEGORY#${categorySlug}` },
          ExclusiveStartKey,
        })
      );
      (result.Items ?? []).forEach((item) => items.push(fromDynamoItem(item)));
      ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);

    return items;
  } catch (err) {
    throw new DatabaseError(`Failed to load products for category "${categorySlug}".`, err);
  }
}

export async function listProducts(
  filters: ProductFilters
): Promise<PaginatedResult<ProductSummary>> {
  const { category, q, minPrice, maxPrice, sort = "newest", page = 1, pageSize = 12 } = filters;

  const source = category ? await queryByCategory(category) : await scanAllProducts();

  let filtered = source;

  if (q) {
    const needle = q.toLowerCase().trim();
    filtered = filtered.filter((p) => {
      const haystack = `${p.name} ${p.shortDescription} ${p.tags.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }

  if (typeof minPrice === "number") {
    filtered = filtered.filter((p) => p.priceCents >= minPrice * 100);
  }
  if (typeof maxPrice === "number") {
    filtered = filtered.filter((p) => p.priceCents <= maxPrice * 100);
  }

  const sorters: Record<string, (a: Product, b: Product) => number> = {
    price_asc: (a, b) => a.priceCents - b.priceCents,
    price_desc: (a, b) => b.priceCents - a.priceCents,
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  };
  filtered = [...filtered].sort(sorters[sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize).map(toSummary);

  return { items: pageItems, page: safePage, pageSize, total, totalPages };
}

export async function getProductById(productId: string): Promise<Product> {
  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE, Key: toItemKey(productId) })
    );
    if (!result.Item) throw new NotFoundError("Product", productId);
    return fromDynamoItem(result.Item);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(`Failed to load product "${productId}".`, err);
  }
}

export async function getProductBySlug(slug: string): Promise<Product> {
  // Products are keyed by id, so a slug lookup scans. In production this
  // would be backed by a GSI keyed on slug (unique, low cardinality writes).
  const all = await scanAllProducts();
  const match = all.find((p) => p.slug === slug);
  if (!match) throw new NotFoundError("Product", slug);
  return match;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<ProductSummary[]> {
  const sameCategory = await queryByCategory(product.categorySlug);
  return sameCategory
    .filter((p) => p.productId !== product.productId)
    .slice(0, limit)
    .map(toSummary);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductSummary[]> {
  const all = await scanAllProducts();
  return all
    .filter((p) => p.isFeatured)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map(toSummary);
}

export async function upsertProduct(product: Product): Promise<Product> {
  try {
    await docClient.send(new PutCommand({ TableName: TABLE, Item: toDynamoItem(product) }));
    return product;
  } catch (err) {
    throw new DatabaseError(`Failed to save product "${product.productId}".`, err);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: toItemKey(productId) }));
  } catch (err) {
    throw new DatabaseError(`Failed to delete product "${productId}".`, err);
  }
}

/** Decrements stock as part of checkout/cart flows. Throws if insufficient stock. */
export async function decrementStock(productId: string, quantity: number): Promise<void> {
  const { UpdateCommand } = await import("@aws-sdk/lib-dynamodb");
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: toItemKey(productId),
        UpdateExpression: "SET stock = stock - :qty",
        ConditionExpression: "stock >= :qty",
        ExpressionAttributeValues: { ":qty": quantity },
      })
    );
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === "ConditionalCheckFailedException") {
      throw new DatabaseError("Not enough stock available for this product.", err);
    }
    throw new DatabaseError(`Failed to update stock for product "${productId}".`, err);
  }
}
