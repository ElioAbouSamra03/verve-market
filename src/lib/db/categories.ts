import { DeleteCommand, GetCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "./dynamoClient";
import { ConflictError, DatabaseError, NotFoundError } from "@/lib/errors";
import { getCategoryProductCount, queryByCategory } from "./products";
import type { Category } from "@/types/category";

const TABLE = TableNames.categories;

function toItemKey(slug: string) {
  return { PK: `CATEGORY#${slug}`, SK: "METADATA" };
}

function fromDynamoItem(item: Record<string, unknown>): Category {
  const { PK, SK, entityType, ...category } = item;
  return category as unknown as Category;
}

export async function listCategories(): Promise<Category[]> {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? [])
      .map(fromDynamoItem)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    throw new DatabaseError("Failed to load categories.", err);
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE, Key: toItemKey(slug) })
    );
    if (!result.Item) throw new NotFoundError("Category", slug);
    return fromDynamoItem(result.Item);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(`Failed to load category "${slug}".`, err);
  }
}

export async function upsertCategory(category: Category): Promise<Category> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: { ...toItemKey(category.slug), entityType: "CATEGORY", ...category },
      })
    );
    return category;
  } catch (err) {
    throw new DatabaseError(`Failed to save category "${category.slug}".`, err);
  }
}

/**
 * Recomputes `productCount` from the live product table and persists it.
 * `productCount` is a denormalized, admin-display-only field (the storefront
 * never relies on it for correctness), so it's kept in sync on a best-effort
 * basis by the admin product routes rather than via a DynamoDB Stream —
 * simplest thing that works at this project's scale. See README "Known
 * limitations" for the production alternative (Streams-driven counters).
 */
export async function syncCategoryProductCount(slug: string): Promise<void> {
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) return; // category may have just been deleted; nothing to sync
  const productCount = await getCategoryProductCount(slug);
  if (productCount === category.productCount) return;
  await upsertCategory({ ...category, productCount, updatedAt: new Date().toISOString() });
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
}

/**
 * Updates a category's editable fields. Renaming a category cascades the new
 * display name onto every product's denormalized `categoryName` field so
 * listings don't go stale — the slug (and therefore the product/category
 * relationship itself) never changes here, only the human-readable name.
 */
export async function updateCategory(
  slug: string,
  input: UpdateCategoryInput
): Promise<Category> {
  const existing = await getCategoryBySlug(slug);
  const updated: Category = {
    ...existing,
    ...input,
    slug: existing.slug,
    updatedAt: new Date().toISOString(),
  };
  await upsertCategory(updated);

  if (input.name && input.name !== existing.name) {
    const products = await queryByCategory(slug);
    await Promise.all(
      products.map((product) =>
        docClient
          .send(
            new UpdateCommand({
              TableName: TableNames.products,
              Key: { PK: `PRODUCT#${product.productId}`, SK: "METADATA" },
              UpdateExpression: "SET categoryName = :name, updatedAt = :now",
              ExpressionAttributeValues: { ":name": input.name, ":now": updated.updatedAt },
            })
          )
          .catch((err) => {
            throw new DatabaseError(
              `Failed to cascade category rename to product "${product.productId}".`,
              err
            );
          })
      )
    );
  }

  return updated;
}

/**
 * Deletes a category. Refuses (409) if products are still assigned to it —
 * an admin must reassign or delete those products first, so the catalog
 * never ends up with a product pointing at a category that no longer
 * exists.
 */
export async function deleteCategory(slug: string): Promise<void> {
  const productCount = await getCategoryProductCount(slug);
  if (productCount > 0) {
    throw new ConflictError(
      `Cannot delete "${slug}" — ${productCount} product(s) are still assigned to it. Reassign or delete them first.`
    );
  }
  try {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: toItemKey(slug) }));
  } catch (err) {
    throw new DatabaseError(`Failed to delete category "${slug}".`, err);
  }
}
