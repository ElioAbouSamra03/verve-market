/**
 * Creates all DynamoDB tables + GSIs required by the app.
 *
 * Usage:
 *   npx tsx scripts/createTables.ts
 *
 * Safe to re-run: skips any table that already exists.
 */
import {
  CreateTableCommand,
  CreateTableCommandInput,
  DynamoDBClient,
  ListTablesCommand,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import "dotenv/config";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const USERS = process.env.DYNAMODB_TABLE_USERS ?? "verve_users";
const PRODUCTS = process.env.DYNAMODB_TABLE_PRODUCTS ?? "verve_products";
const CATEGORIES = process.env.DYNAMODB_TABLE_CATEGORIES ?? "verve_categories";
const CART = process.env.DYNAMODB_TABLE_CART ?? "verve_cart";
const WISHLIST = process.env.DYNAMODB_TABLE_WISHLIST ?? "verve_wishlist";

async function createTable(input: CreateTableCommandInput) {
  try {
    await client.send(new CreateTableCommand(input));
    console.log(`✅ Created table: ${input.TableName}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`↷  Table already exists, skipping: ${input.TableName}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const existing = await client.send(new ListTablesCommand({}));
  console.log("Existing tables:", existing.TableNames ?? []);

  await createTable({
    TableName: PRODUCTS,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });

  await createTable({
    TableName: CATEGORIES,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
  });

  await createTable({
    TableName: CART,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
  });

  await createTable({
    TableName: WISHLIST,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
  });

  await createTable({
    TableName: USERS,
    BillingMode: "PAY_PER_REQUEST",
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  });

  console.log("\nAll tables ready.");
}

main().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
