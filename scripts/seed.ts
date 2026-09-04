/**
 * Populates DynamoDB with sample categories and products for local development
 * and demoing. Run `npx tsx scripts/createTables.ts` first.
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { upsertCategory } from "../src/lib/db/categories";
import { upsertProduct } from "../src/lib/db/products";
import { seedCategories, seedProducts } from "../src/data/seedData";

async function main() {
  console.log(`Seeding ${seedCategories.length} categories…`);
  for (const category of seedCategories) {
    const count = seedProducts.filter((p) => p.categorySlug === category.slug).length;
    await upsertCategory({ ...category, productCount: count });
    console.log(`  ✓ ${category.name}`);
  }

  console.log(`\nSeeding ${seedProducts.length} products…`);
  for (const product of seedProducts) {
    await upsertProduct(product);
    console.log(`  ✓ ${product.name}`);
  }

  console.log("\nDone. Start the app with `npm run dev`.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
