/**
 * Category domain types.
 *
 * DynamoDB table: verve_categories
 * PK: CATEGORY#<slug>   SK: METADATA
 */

export interface Category {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}
