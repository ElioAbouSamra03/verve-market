import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { docClient, TableNames } from "./dynamoClient";
import { ConflictError, DatabaseError, NotFoundError } from "@/lib/errors";
import type { CreateUserInput, User } from "@/types/user";

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
