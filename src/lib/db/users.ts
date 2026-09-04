import { DeleteCommand, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { docClient, TableNames } from "./dynamoClient";
import { ConflictError, DatabaseError, NotFoundError } from "@/lib/errors";
import type { CreateUserInput, User } from "@/types/user";
import type { PaginatedResult } from "@/types/product";

const TABLE = TableNames.users;

function itemKey(userId: string) {
  return { PK: `USER#${userId}`, SK: "PROFILE" };
}

function fromDynamoItem(item: Record<string, unknown>): User {
  const { PK, SK, GSI1PK, GSI1SK, entityType, ...rest } = item;
  return rest as unknown as User;
}

export async function getUserById(userId: string): Promise<User> {
  try {
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: itemKey(userId) }));
    if (!result.Item) throw new NotFoundError("User", userId);
    return fromDynamoItem(result.Item);
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(`Failed to load user "${userId}".`, err);
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `EMAIL#${email.toLowerCase()}` },
      })
    );
    const item = result.Items?.[0];
    return item ? fromDynamoItem(item) : null;
  } catch (err) {
    throw new DatabaseError("Failed to look up user by email.", err);
  }
}

export interface AdminUserFilters {
  q?: string; // matches name or email
  page?: number;
  pageSize?: number;
}

/** Admin listing. Scans the whole users table and filters/sorts/paginates in
 *  memory — same documented trade-off as `listCategories`/`listProducts`
 *  (fine at demo scale; see README for the production alternative). */
export async function listUsers(filters: AdminUserFilters): Promise<PaginatedResult<User>> {
  const { q, page = 1, pageSize = 20 } = filters;

  try {
    const items: User[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLE, ExclusiveStartKey })
      );
      (result.Items ?? []).forEach((item) => items.push(fromDynamoItem(item)));
      ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (ExclusiveStartKey);

    let filtered = items;
    if (q) {
      const needle = q.toLowerCase().trim();
      filtered = filtered.filter(
        (u) => u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
      );
    }
    filtered = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), page: safePage, pageSize, total, totalPages };
  } catch (err) {
    throw new DatabaseError("Failed to load users.", err);
  }
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

/** Updates a user's profile. If the email changes, re-checks the "one
 *  account per email" invariant and re-points the GSI1 lookup key —
 *  otherwise `getUserByEmail` would keep returning the stale record. */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<User> {
  const existing = await getUserById(userId);

  const nextEmail = input.email ? input.email.toLowerCase() : existing.email;
  if (nextEmail !== existing.email) {
    const conflict = await getUserByEmail(nextEmail);
    if (conflict && conflict.userId !== userId) {
      throw new ConflictError("An account with this email already exists.");
    }
  }

  const updated: User = {
    ...existing,
    ...input,
    email: nextEmail,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...itemKey(updated.userId),
          GSI1PK: `EMAIL#${updated.email}`,
          GSI1SK: "PROFILE",
          entityType: "USER",
          ...updated,
        },
      })
    );
    return updated;
  } catch (err) {
    throw new DatabaseError(`Failed to update user "${userId}".`, err);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: itemKey(userId) }));
  } catch (err) {
    throw new DatabaseError(`Failed to delete user "${userId}".`, err);
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const existing = await getUserByEmail(input.email);
  if (existing) throw new ConflictError("An account with this email already exists.");

  const now = new Date().toISOString();
  const user: User = {
    userId: randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          ...itemKey(user.userId),
          GSI1PK: `EMAIL#${user.email}`,
          GSI1SK: "PROFILE",
          entityType: "USER",
          ...user,
        },
      })
    );
    return user;
  } catch (err) {
    throw new DatabaseError("Failed to create user.", err);
  }
}
