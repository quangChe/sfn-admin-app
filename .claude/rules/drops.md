---
description: Drop management system — rules, architecture, and conventions for all drop-related features
globs:
  - src/app/(dashboard)/drops/**
  - src/app/api/shopify/drops/**
  - src/lib/shopify/queries/drops.ts
  - src/components/drops/**
  - src/types/drops.ts
---

# Drop Management System

FashioNica sells pre-loved designer items in curated weekly "drops." Each drop is a
date-stamped collection of Shopify products. This file is the authoritative spec for
all drop-related code in this repo.

---

## 1. Core Data Model

**Drops live entirely in Shopify product tags. There is no database.**

- A product belongs to a drop by having a tag in the format `M.D.YY`
- Examples: `5.1.26`, `5.10.26`, `5.15.26`
- NEVER zero-pad: `5.1.26` is correct, `05.01.26` is WRONG
- A product can only belong to one drop tag at a time
- Products persist on Shopify after selling (for SEO) — status changes to ARCHIVED
- The drop date IS the tag string — parse it, never store it separately

### Tag parsing utility — always use this, never roll ad-hoc parsing:
```ts
// src/lib/drops/parse-tag.ts
export function parseDropTag(tag: string): Date | null {
  const match = tag.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (!match) return null;
  const [, m, d, y] = match;
  return new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d));
}

export function formatDropTag(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}.${String(date.getFullYear()).slice(-2)}`;
}

export function isDropTag(tag: string): boolean {
  return /^\d{1,2}\.\d{1,2}\.\d{2}$/.test(tag);
}
```

---

## 2. Routes

```
/drops                          → Drop Calendar (month view, server component)
/drops/[tag]                    → Drop Workspace (bulk-edit hub, client component)
/drops/[tag]/pricing            → Pricing workflow tab
/drops/[tag]/copy               → Copy workflow tab
/drops/[tag]/specs              → Specifications workflow tab
/drops/[tag]/media              → Media review workflow tab
/drops/[tag]/channels           → Channel sync workflow tab
```

- `[tag]` param is the raw tag string: `5.15.26`
- The `/drops/[tag]` layout is a **client component** — it manages tab state and
  unsaved changes locally before batch-submitting
- `/drops` calendar page is a **server component** — fetches all tagged products
  once, groups by tag, passes drop summaries to client calendar

---

## 3. Shopify Query Patterns

### Fetch all drops (for calendar):
```graphql
query GetDropProducts($after: String) {
  products(first: 250, after: $after, query: "tag_prefix:") {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        tags
        status
        totalInventory
        priceRangeV2 {
          minVariantPrice { amount }
        }
      }
    }
  }
}
```
Filter client-side with `isDropTag()` after fetching. Group by tag to build drop summaries.

### Fetch products for a specific drop:
```graphql
query GetDropByTag($tag: String!, $after: String) {
  products(first: 50, after: $after, query: $tag) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        title
        status
        tags
        images(first: 6) {
          edges { node { id url altText } }
        }
        variants(first: 1) {
          edges {
            node {
              id
              price
              compareAtPrice
              inventoryQuantity
            }
          }
        }
        metafields(
          identifiers: [{ namespace: "custom", key: "cost" }]
        ) {
          key value
        }
      }
    }
  }
}
```
The query string for a tag like `5.15.26` is: `"tag:'5.15.26'"` — always wrap in single quotes inside the string.

### Bulk price update — ALWAYS batch, never loop:
```graphql
mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price compareAtPrice }
    userErrors { field message }
  }
}
```
Collect ALL changes across the tab, then fire one mutation per product (not per field, not per product-per-field).

---

## 4. File & Folder Layout

When building drop features, create files in these locations:

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── drops/
│   │       ├── page.tsx                 ← Calendar (server component)
│   │       ├── [tag]/
│   │       │   ├── layout.tsx           ← Drop workspace shell + tab nav
│   │       │   ├── page.tsx             ← Redirects to /pricing by default
│   │       │   ├── pricing/page.tsx
│   │       │   ├── copy/page.tsx
│   │       │   ├── specs/page.tsx
│   │       │   ├── media/page.tsx
│   │       │   └── channels/page.tsx
│   └── api/
│       └── shopify/
│           └── drops/
│               ├── route.ts             ← GET all drops (calendar data)
│               ├── [tag]/route.ts       ← GET products for a specific drop
│               └── [tag]/bulk/route.ts  ← PATCH bulk update (pricing/copy/etc.)
├── components/
│   └── drops/
│       ├── drop-calendar.tsx            ← Month grid, client component
│       ├── drop-card.tsx                ← Sidebar card per drop
│       ├── drop-workspace-layout.tsx    ← Tab shell + save bar
│       ├── workflow-tabs/
│       │   ├── pricing-tab.tsx
│       │   ├── copy-tab.tsx
│       │   ├── specs-tab.tsx
│       │   ├── media-tab.tsx
│       │   └── channels-tab.tsx
│       └── bulk-table/
│           ├── product-row.tsx          ← Shared row shell (thumb + title)
│           └── expandable-images.tsx    ← Inline image gallery on expand
├── lib/
│   └── drops/
│       ├── parse-tag.ts                 ← Tag parsing utilities (see §1)
│       ├── queries.ts                   ← GraphQL query strings
│       └── mutations.ts                 ← GraphQL mutation strings
└── types/
    └── drops.ts                         ← Drop, DropProduct, WorkflowTab types
```

---

## 5. Drop Status Lifecycle

Drops do not have a status field in Shopify. Derive it from the tag date vs today:

```ts
type DropStatus = 'draft' | 'upcoming' | 'live' | 'ended';

function getDropStatus(tagDate: Date, now = new Date()): DropStatus {
  const msSinceStart = now.getTime() - tagDate.getTime();
  const dayMs = 86_400_000;
  if (msSinceStart < -2 * dayMs) return 'draft';      // > 2 days away
  if (msSinceStart < 0) return 'upcoming';             // within 2 days
  if (msSinceStart < 1 * dayMs) return 'live';         // drop day
  return 'ended';                                       // past
}
```

Do NOT persist status anywhere — always derive it at render time.

---

## 6. Workflow Tabs

Each tab is a focused bulk-editor. They share the same product list and row shell,
but render different editable columns. All tabs follow this pattern:

- **Read**: products fetched once when entering the drop workspace, stored in React state
- **Edit**: changes tracked in a local `Map<productId, Partial<ProductUpdate>>`
- **Save**: single "Save All" click fires bulk mutations for all dirty products
- **Status dot per product**: `done` (all fields filled) | `partial` | `empty`

### Tab specs:

#### 💰 Pricing Tab
Columns: thumbnail, title+SKU, cost (read-only from metafield), sell price (editable),
compare-at price (editable), margin % (computed), status dot, actions.

- Margin = `(price - cost) / price * 100`, shown in green if > 20%, yellow if < 20%
- "Suggest" button → POST `/api/ai/price-suggest` with `{ title, productType, imageUrl }`
- "Lens" button → opens `https://lens.google.com/uploadbyurl?url={encodedImageUrl}` in new tab
- A product is `done` when `price > 0`

#### ✍️ Copy Tab
Columns: thumbnail, title (editable input), description / condition notes (editable textarea),
status dot.

- Title max 255 chars — show char counter when within 20 chars of limit
- Description is `product.descriptionHtml` — edit as plain text, save as HTML (wrap in `<p>`)
- A product is `done` when title and description are both non-empty

#### 📋 Specs Tab
Columns: thumbnail, title, condition grade (A/B/C select), material (text), hardware color
(text), year (number), serial number (text), status dot.

- These map to Shopify product metafields: `namespace: "fashionica"`, keys: `condition_grade`,
  `material`, `hardware_color`, `year`, `serial_number`
- A product is `done` when condition_grade is set

#### 📸 Media Tab
Columns: thumbnail (click to expand all images inline), image count badge, re-shoot flag
toggle, notes (text), status dot.

- Read-only for image content — this tab is for REVIEW, not upload
- Re-shoot flag = adding a `needs-reshoot` tag to the product
- A product is `done` when it has ≥ 3 images and no reshoot flag

#### 📡 Channel Sync Tab
Columns: thumbnail, title, Shopify (always on), TikTok toggle, Whatnot toggle,
TikTok price override (optional), Whatnot price override (optional).

- Channel sync is managed via product tags: `tiktok-sync`, `whatnot-sync`
- Price overrides → metafields: `namespace: "channels"`, keys: `tiktok_price`, `whatnot_price`
- A product is `done` when at least one channel is toggled on

---

## 7. Shared Bulk Table UI Rules

- **First column always sticky**: product thumbnail (48×48px, rounded-md) + title + SKU
- **Expand button** next to SKU: reveals additional images inline (accordion, no modal)
- **Editable cells**: use `<input>` or `<textarea>`, not contentEditable
- **Tab key** should move focus to the next editable cell in the same column (not next row)
- **Dirty state**: changed cells get a subtle left border in `var(--burgundy)` (`border-l-2 border-primary`)
- **Save bar** is sticky at the bottom of the workspace layout, always visible:
  - Left: "N unsaved changes in [Tab Name] view" — N = count of dirty products
  - Right: "Discard" (ghost) + "Save All Changes" (primary/burgundy)
  - Save bar is disabled (grayed) when N = 0

---

## 8. AI Price Suggestion Endpoint

```
POST /api/ai/price-suggest
Body: { title: string, productType: string, imageUrl: string }
Response: { low: number, mid: number, high: number, sources: string[] }
```

Implementation: call Anthropic API with `web_search` tool enabled. Prompt instructs
it to search Vestiaire Collective, The RealReal, eBay, and Google Shopping for the
item and return a JSON price range. Use `claude-sonnet-4-20250514` (not Haiku — pricing
accuracy matters here). Parse the JSON from the response content blocks.

NEVER call this endpoint in a loop for all products — it is user-initiated per row only.

---

## 9. Invariants — Never Violate These

- NEVER save product updates one-at-a-time in a loop. Always batch.
- NEVER store the drop date in any database, state, or cookie. Parse it from the tag.
- NEVER use zero-padded tag format. `5.1.26` not `05.01.26`.
- NEVER modify a product's drop tag from within the drop workspace. Tag assignment
  is managed separately (product detail page or future "assign to drop" flow).
- NEVER show archived/sold products in the "active" drop count — filter them out
  in the calendar summary, but DO include them in the workspace (for reference).
- NEVER fetch all 11k products to build the calendar. Always query with tag filters.
- The `/drops/[tag]/layout.tsx` owns unsaved state. Child tab pages read/write via
  context — they do NOT manage their own save state.
