# Verve Market

A production-style, full-stack e-commerce storefront built as a software engineering
capstone project. It focuses on **architecture, data modeling, and business logic** as
much as UI — every mutation runs through validation, a documented DynamoDB schema, and
a consistent error-handling layer.

**Stack:** Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · AWS DynamoDB

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [DynamoDB design](#dynamodb-design)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Known limitations / production roadmap](#known-limitations--production-roadmap)
- [Screenshots](#screenshots)

---

## Features

**Storefront**
- Responsive homepage with featured categories and featured products
- Category landing pages
- Product listing with search, category filter, price range, and sort
- Product detail pages with variants, related products, and stock-aware add-to-cart
- Pagination

**Cart & wishlist**
- Add to cart with quantity and variant selection
- Update quantity / remove line items, subtotal calculated server-side
- Wishlist add/remove with duplicate prevention enforced at the database layer
- Cart merges duplicate additions into a single line item instead of creating a second one

**Application experience**
- Loading skeletons, empty states, and error states with retry, on every data view
- Route-level error boundaries (`error.tsx`) and a global 404 page (`not-found.tsx`)
- Server-side input validation (Zod) on every mutating endpoint, with 422 responses
- Mobile / tablet / desktop responsive layout throughout

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Colocates UI, API route handlers, and server components in one project |
| Language | TypeScript (strict mode) | Compile-time safety across the API/DB boundary |
| Styling | Tailwind CSS | Fast, consistent design-token-driven styling |
| Database | AWS DynamoDB | Serverless, scales to zero, pay-per-request billing fits a demo/portfolio project |
| Validation | Zod | Schema validation + inferred TypeScript types from one source of truth |
| SDK | `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` | Official AWS SDK v3, document client for ergonomic JSON reads/writes |

---

## Architecture

```
Browser (React components)
      │  fetch() via src/lib/apiClient.ts
      ▼
Next.js Route Handlers  (src/app/api/**/route.ts)
      │  Zod validation → business logic
      ▼
Data access layer        (src/lib/db/*.ts)
      │  AWS SDK v3 DynamoDBDocumentClient
      ▼
AWS DynamoDB
```

Server Components (`page.tsx` files for the homepage, product listing, product detail,
and category pages) call the data-access layer **directly** — they don't round-trip
through the app's own HTTP API, since they already run on the server. Client-side
mutations (add to cart, toggle wishlist, update quantity) go through the API routes,
because they originate in the browser and need request validation, session resolution,
and a JSON response contract.

**Separation of concerns**

| Concern | Location |
|---|---|
| UI components | `src/components/**` |
| Pages / routing | `src/app/**/page.tsx` |
| API / server functionality | `src/app/api/**/route.ts` |
| Business logic + database operations | `src/lib/db/*.ts` |
| Input validation | `src/lib/validation/schemas.ts` |
| Error taxonomy | `src/lib/errors.ts` |
| Types & interfaces | `src/types/*.ts` |
| Utility functions | `src/lib/utils/*.ts` |
| Client-side global state | `src/context/*.tsx` |

**Error handling.** Every route handler wraps its logic in try/catch and funnels the
result through `ok()/created()/noContent()` (success) or `fail()` (error) from
`src/lib/utils/apiResponse.ts`. `fail()` recognizes `ZodError` (→ 422), the app's own
`AppError` subclasses (`NotFoundError` → 404, `ConflictError` → 409, `OutOfStockError` →
409, `DatabaseError` → 502), and falls back to a generic 500 for anything unexpected —
so raw AWS SDK errors or stack traces never reach the client.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout: fonts, providers, header/footer
│   ├── loading.tsx / not-found.tsx # Global loading + 404
│   ├── products/
│   │   ├── page.tsx                # Listing: search, filter, sort, pagination
│   │   ├── error.tsx               # Route-level error boundary
│   │   └── [id]/page.tsx           # Product detail (param is the product slug)
│   ├── categories/[slug]/page.tsx  # Category landing page
│   ├── cart/page.tsx               # Cart (client component, uses CartContext)
│   ├── wishlist/page.tsx           # Wishlist (client component)
│   └── api/
│       ├── products/route.ts, products/[id]/route.ts
│       ├── categories/route.ts
│       ├── cart/route.ts, cart/[id]/route.ts
│       ├── wishlist/route.ts, wishlist/[id]/route.ts
│       └── users/route.ts
├── components/
│   ├── layout/     (Header, Footer)
│   ├── product/    (ProductCard, ProductGrid, AddToCartForm, RelatedProducts)
│   ├── cart/       (CartLineItem)
│   ├── wishlist/   (WishlistCard)
│   ├── search/     (FilterSidebar, Pagination)
│   └── ui/         (Button, EmptyState, ErrorState, Loading, Price)
├── context/         # CartContext, WishlistContext — client-side global state
├── lib/
│   ├── db/          # DynamoDB access layer: products, categories, cart, wishlist, users
│   ├── validation/  # Zod schemas
│   ├── utils/       # apiResponse, session (guest id), format
│   ├── apiClient.ts # fetch wrapper used by React contexts
│   └── errors.ts    # AppError hierarchy
├── types/           # Product, Category, CartItem, WishlistItem, User
└── data/seedData.ts # Sample catalog used by scripts/seed.ts

scripts/
├── createTables.ts  # Creates DynamoDB tables + GSIs (idempotent)
└── seed.ts          # Populates sample categories/products
```

---

## DynamoDB design

Five tables, each single-table-per-entity (not one shared mega-table, to keep the
schema easy to follow for review purposes). Every table uses **on-demand billing**
(`PAY_PER_REQUEST`) so cost scales to zero.

### `verve_products`
| | |
|---|---|
| PK | `PRODUCT#<productId>` |
| SK | `METADATA` |
| GSI1 | `GSI1PK = CATEGORY#<categorySlug>`, `GSI1SK = PRODUCT#<productId>` — powers "browse by category" without a table scan |

Reads: `GetItem` by id, `Query` on GSI1 for category browsing, `Scan` (paginated) for
free-text search across the whole catalog. Writes: `PutItem` (create/replace),
`UpdateItem` with a `ConditionExpression` (`stock >= :qty`) to decrement stock safely.

> **Why Scan for search?** DynamoDB has no native full-text search. Scanning the whole
> table and filtering in memory is fine at demo scale (dozens–low thousands of items)
> and keeps the project self-contained. See [Known limitations](#known-limitations--production-roadmap)
> for the production alternative (DynamoDB Streams → OpenSearch/Algolia).

### `verve_categories`
| | |
|---|---|
| PK | `CATEGORY#<slug>` |
| SK | `METADATA` |

Simple key-value lookup; the catalog is small enough that `listCategories()` scans
the whole table and sorts client-side.

### `verve_cart`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `ITEM#<productId>#<variantId or "base">` |

Each cart line item is its own DynamoDB item (not one JSON blob per user) so quantity
updates and removals are single, cheap, **conditional** writes instead of a
read-modify-write race between two open tabs. `getCart()` runs one `Query` on the
partition key and computes `itemCount`/`subtotalCents` in the data-access layer.
Prices are **denormalized** into a `productSnapshot` at add-time, so historical cart
totals don't silently change if a product's price is edited later.

### `verve_wishlist`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `PRODUCT#<productId>` |

Duplicate prevention uses a conditional `PutItem`
(`ConditionExpression: attribute_not_exists(PK)`) rather than "check, then write" —
this closes the race condition a naive approach has under concurrent requests (double
click, two open tabs) and surfaces as a clean `409 CONFLICT` from the API.

### `verve_users`
| | |
|---|---|
| PK | `USER#<userId>` |
| SK | `PROFILE` |
| GSI1 | `GSI1PK = EMAIL#<email>`, `GSI1SK = PROFILE` — enforces "one account per email" via lookup-before-create |

---

## API reference

Every response is a consistent JSON envelope:
```json
{ "success": true, "data": { /* ... */ } }
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "...", "details": {} } }
```

| Method & path | Description | Validated body |
|---|---|---|
| `GET /api/products?category=&q=&minPrice=&maxPrice=&sort=&page=&pageSize=` | Search/filter/sort/paginate the catalog | query params |
| `GET /api/products/:id` | Product detail + related products | — |
| `GET /api/categories` | List all categories | — |
| `GET /api/cart` | Current user's cart + computed subtotal | — |
| `POST /api/cart` | Add item (merges into existing line item) | `{ productId, quantity, variantId? }` |
| `PATCH /api/cart/:productId?variantId=` | Update line item quantity | `{ quantity }` |
| `DELETE /api/cart/:productId?variantId=` | Remove one line item | — |
| `DELETE /api/cart` | Empty the cart | — |
| `GET /api/wishlist` | List wishlist items | — |
| `POST /api/wishlist` | Add product (409 if already present) | `{ productId }` |
| `DELETE /api/wishlist/:productId` | Remove item | — |
| `POST /api/users` | Create a user profile (409 on duplicate email) | `{ email, name }` |

The "current user" for cart/wishlist is resolved by `src/lib/utils/session.ts`, which
issues and persists a `guest_<uuid>` in an httpOnly cookie. See
[Known limitations](#known-limitations--production-roadmap) for how this plugs into
real authentication.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Optional — point at DynamoDB Local for offline development instead of real AWS
DYNAMODB_ENDPOINT=http://localhost:8000

DYNAMODB_TABLE_USERS=verve_users
DYNAMODB_TABLE_PRODUCTS=verve_products
DYNAMODB_TABLE_CATEGORIES=verve_categories
DYNAMODB_TABLE_CART=verve_cart
DYNAMODB_TABLE_WISHLIST=verve_wishlist

NEXT_PUBLIC_APP_NAME="Verve Market"
```

Credentials are never hardcoded anywhere in the codebase — the DynamoDB client
(`src/lib/db/dynamoClient.ts`) reads them from `process.env` and otherwise falls back
to the standard AWS credential provider chain (IAM role, shared config, etc.), which
is what a real deployment (Lambda, ECS, Amplify) would use instead of static keys.

---

## Installation

### 1. Prerequisites
- Node.js 18+
- An AWS account with DynamoDB access **or** [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) for offline dev (`docker run -p 8000:8000 amazon/dynamodb-local`)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
# then edit .env.local with your AWS credentials or leave DYNAMODB_ENDPOINT set
# for local DynamoDB
```

### 4. Create tables and seed sample data
```bash
npx tsx scripts/createTables.ts
npm run seed
```

### 5. Run the app
```bash
npm run dev
# open http://localhost:3000
```

### Other scripts
```bash
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

---

## Known limitations / production roadmap

This project is scoped to demonstrate architecture and data modeling, not to be a
finished commercial platform. Documented trade-offs:

- **Authentication.** Cart/wishlist ownership is resolved by a guest cookie
  (`lib/utils/session.ts`), not a full login system. Every DB function already takes
  a plain `userId: string`, so swapping in real auth (NextAuth, Cognito, custom JWT)
  only requires changing that one function.
- **Search.** Free-text search scans the products table and filters in memory
  (see [DynamoDB design](#dynamodb-design)). At real scale this would move to
  DynamoDB Streams feeding OpenSearch or Algolia for faceted, ranked search.
- **Checkout/payments.** The cart supports subtotal calculation but there's no
  payment integration (Stripe, etc.) or order-history table — "Proceed to checkout"
  is a clearly-marked stub for a future milestone.
- **Product image storage.** Images are served from Unsplash URLs for demo purposes;
  a production version would use S3 + CloudFront.

---