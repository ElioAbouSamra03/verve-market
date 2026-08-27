import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TableNames } from "./dynamoClient";
import { DatabaseError, NotFoundError } from "@/lib/errors";
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
