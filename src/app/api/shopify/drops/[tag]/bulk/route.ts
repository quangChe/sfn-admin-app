import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/permissions";
import { getShopifyClient } from "@/lib/shopify/client";
import { emitEvent } from "@/lib/events/emit";
import type { EventName } from "@/lib/events/emit";

type GqlUserError = { field: string[]; message: string };
type PricingData = { productVariantsBulkUpdate?: { productVariants: unknown[]; userErrors: GqlUserError[] } };
type CopyData = { productUpdate?: { product: unknown; userErrors: GqlUserError[] } };
type MetafieldsData = { metafieldsSet?: { metafields: unknown[]; userErrors: GqlUserError[] } };

const PRODUCT_VARIANTS_BULK_UPDATE = `
  mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

const PRODUCT_UPDATE = `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id title descriptionHtml }
      userErrors { field message }
    }
  }
`;

const METAFIELDS_SET = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { namespace key value }
      userErrors { field code message }
    }
  }
`;

const TAGS_ADD = `
  mutation TagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

const TAGS_REMOVE = `
  mutation TagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      node { id }
      userErrors { field message }
    }
  }
`;

interface PriceChange {
  productId: string;
  variantId: string;
  price: string;
  compareAtPrice?: string | null;
  previousPrice?: string | null;
}

interface CopyChange {
  productId: string;
  title: string;
  descriptionHtml: string;
}

interface SpecsChange {
  productId: string;
  metafields: Array<{ namespace: string; key: string; value: string; type: string }>;
}

interface MediaChange {
  productId: string;
  addTags?: string[];
  removeTags?: string[];
  notes?: string | null;
}

interface ChannelChange {
  productId: string;
  addTags?: string[];
  removeTags?: string[];
  metafields?: Array<{ namespace: string; key: string; value: string; type: string }>;
}

type BulkBody =
  | { type?: "pricing"; changes: PriceChange[] }
  | { type: "copy"; changes: CopyChange[] }
  | { type: "specs"; changes: SpecsChange[] }
  | { type: "media"; changes: MediaChange[] }
  | { type: "channels"; changes: ChannelChange[] };

const PERMISSION_MAP: Record<string, string> = {
  pricing: "pricing:edit",
  copy: "copy:edit",
  specs: "specs:edit",
  media: "drops:edit",
  channels: "drops:edit",
};

const EVENT_MAP: Record<string, EventName> = {
  pricing: "drop.product.priced",
  copy: "drop.product.copy_edited",
  specs: "drop.product.specs_edited",
  media: "drop.product.specs_edited",
  channels: "drop.product.specs_edited",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const session = await getSession(req.headers);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tag } = await params;
  if (!tag) {
    return NextResponse.json({ error: "Missing tag param" }, { status: 400 });
  }

  let body: BulkBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { changes } = body;
  if (!Array.isArray(changes) || changes.length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const type = body.type ?? "pricing";
  const requiredPermission = PERMISSION_MAP[type];

  try {
    requirePermission(session, requiredPermission);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eventName = EVENT_MAP[type];

  try {
    // Emit audit events BEFORE Shopify mutations
    if (type === "pricing") {
      for (const c of changes as PriceChange[]) {
        await emitEvent(eventName, {
          entityType: "shopify_product",
          entityId: c.productId,
          field: "price",
          oldValue: c.previousPrice ?? null,
          newValue: c.price,
          userId: session.user.id,
          source: "pricing_tab",
          metadata: { tag, variantId: c.variantId },
        });
      }
    } else if (type === "copy") {
      for (const c of changes as CopyChange[]) {
        await emitEvent(eventName, {
          entityType: "shopify_product",
          entityId: c.productId,
          field: "copy",
          newValue: { title: c.title },
          userId: session.user.id,
          source: "copy_tab",
          metadata: { tag },
        });
      }
    } else {
      // specs / media / channels — emit once per product
      for (const c of changes as (SpecsChange | MediaChange | ChannelChange)[]) {
        await emitEvent(eventName, {
          entityType: "shopify_product",
          entityId: c.productId,
          userId: session.user.id,
          source: `${type}_tab`,
          metadata: { tag },
        });
      }
    }

    const client = await getShopifyClient();
    const errors: unknown[] = [];

    if (type === "pricing") {
      const priceChanges = changes as PriceChange[];
      const byProduct = new Map<string, PriceChange[]>();
      for (const c of priceChanges) {
        const arr = byProduct.get(c.productId) ?? [];
        arr.push(c);
        byProduct.set(c.productId, arr);
      }
      for (const [productId, productChanges] of byProduct) {
        const variants = productChanges.map((c) => ({
          id: c.variantId,
          price: c.price,
          compareAtPrice: c.compareAtPrice ?? null,
        }));
        const { data, errors: gqlErrors } = await client.request(
          PRODUCT_VARIANTS_BULK_UPDATE,
          { variables: { productId, variants } }
        );
        if (gqlErrors) {
          errors.push({ productId, errors: gqlErrors });
        } else {
          const userErrors = (data as PricingData)?.productVariantsBulkUpdate?.userErrors ?? [];
          if (userErrors.length > 0) errors.push({ productId, errors: userErrors });
        }
      }
    } else if (type === "copy") {
      for (const c of changes as CopyChange[]) {
        const { data, errors: gqlErrors } = await client.request(PRODUCT_UPDATE, {
          variables: { input: { id: c.productId, title: c.title, descriptionHtml: c.descriptionHtml } },
        });
        if (gqlErrors) {
          errors.push({ productId: c.productId, errors: gqlErrors });
        } else {
          const userErrors = (data as CopyData)?.productUpdate?.userErrors ?? [];
          if (userErrors.length > 0) errors.push({ productId: c.productId, errors: userErrors });
        }
      }
    } else if (type === "specs") {
      const allMetafields = (changes as SpecsChange[]).flatMap((c) =>
        c.metafields.map((mf) => ({ ...mf, ownerId: c.productId }))
      );
      if (allMetafields.length > 0) {
        const { data, errors: gqlErrors } = await client.request(METAFIELDS_SET, {
          variables: { metafields: allMetafields },
        });
        if (gqlErrors) errors.push({ errors: gqlErrors });
        else {
          const userErrors = (data as MetafieldsData)?.metafieldsSet?.userErrors ?? [];
          if (userErrors.length > 0) errors.push({ errors: userErrors });
        }
      }
    } else if (type === "media" || type === "channels") {
      const typedChanges = changes as (MediaChange | ChannelChange)[];
      for (const c of typedChanges) {
        if (c.addTags && c.addTags.length > 0) {
          const { errors: gqlErrors } = await client.request(TAGS_ADD, {
            variables: { id: c.productId, tags: c.addTags },
          });
          if (gqlErrors) errors.push({ productId: c.productId, errors: gqlErrors });
        }
        if (c.removeTags && c.removeTags.length > 0) {
          const { errors: gqlErrors } = await client.request(TAGS_REMOVE, {
            variables: { id: c.productId, tags: c.removeTags },
          });
          if (gqlErrors) errors.push({ productId: c.productId, errors: gqlErrors });
        }
        const metafields =
          type === "media"
            ? (c as MediaChange).notes != null
              ? [{ ownerId: c.productId, namespace: "fashionica", key: "reshoot_notes", value: (c as MediaChange).notes ?? "", type: "single_line_text_field" }]
              : []
            : ((c as ChannelChange).metafields ?? []).map((mf) => ({ ...mf, ownerId: c.productId }));

        if (metafields.length > 0) {
          const { data, errors: gqlErrors } = await client.request(METAFIELDS_SET, {
            variables: { metafields },
          });
          if (gqlErrors) errors.push({ productId: c.productId, errors: gqlErrors });
          else {
            const userErrors = (data as MetafieldsData)?.metafieldsSet?.userErrors ?? [];
            if (userErrors.length > 0) errors.push({ productId: c.productId, errors: userErrors });
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors, partial: true }, { status: 207 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Failed to save changes" }, { status: 500 });
  }
}
