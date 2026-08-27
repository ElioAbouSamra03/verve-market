import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Single, reused DynamoDB client for the whole server process.
 *
 * Next.js can call this module many times per request lifecycle (route
 * handlers, server components, server actions) — we don't want to open a
 * new low-level client each time, so it's created once and memoized on
 * `globalThis` the same way Prisma/DB clients usually are in Next.js apps,
 * which also protects against duplicate clients during hot-reload in dev.
 */

declare global {
  // eslint-disable-next-line no-var
  var __dynamoDocClient: DynamoDBDocumentClient | undefined;
}

function createClient(): DynamoDBDocumentClient {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const endpoint = process.env.DYNAMODB_ENDPOINT; // optional, for local dev

  const baseClient = new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
    // Credentials resolve automatically from the standard AWS provider chain
    // (env vars, shared config file, or IAM role in deployed environments).
    // We only pass explicit keys here for local/dev convenience.
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

  return DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });
}

export const docClient: DynamoDBDocumentClient =
  globalThis.__dynamoDocClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__dynamoDocClient = docClient;
}

export const TableNames = {
  users: process.env.DYNAMODB_TABLE_USERS ?? "verve_users",
  products: process.env.DYNAMODB_TABLE_PRODUCTS ?? "verve_products",
  categories: process.env.DYNAMODB_TABLE_CATEGORIES ?? "verve_categories",
  cart: process.env.DYNAMODB_TABLE_CART ?? "verve_cart",
  wishlist: process.env.DYNAMODB_TABLE_WISHLIST ?? "verve_wishlist",
} as const;
