import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopifyClient } from "@/lib/shopify/client";
import { DROP_PRODUCTS_QUERY } from "@/lib/shopify/queries/drops";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct } from "@/types/drops";

interface ShopifyImageEdge {
  node: { id: string; url: string; altText: string | null };
}
interface ShopifyVariantNode {
  id: string; sku: string; price: string; compareAtPrice: string | null; inventoryQuantity: number;
}
interface ShopifyProductNode {
  id: string; title: string; description: string; handle: string; status: string; tags: string[];
  images: { edges: ShopifyImageEdge[] };
  variants: { edges: Array<{ node: ShopifyVariantNode }> };
  metafields: Array<{ namespace: string; key: string; value: string } | null>;
}
interface DropProductsData {
  products?: {
    edges: Array<{ node: ShopifyProductNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string };
  };
}

export const GET = auth(async (req, { params }) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tag } = await params;
  if (!tag) {
    return NextResponse.json({ error: "Missing tag param" }, { status: 400 });
  }

  const tagStr = decodeURIComponent(tag);

  try {
    const client = await getShopifyClient();
    const query = `tag:'${tagStr}'`;

    const allProducts: DropProduct[] = [];
    let after: string | undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const { data, errors } = await client.request(DROP_PRODUCTS_QUERY, {
        variables: { tag: query, after },
      });

      if (errors) {
        console.error("Drop products error:", errors);
        return NextResponse.json(
          { products: MOCK_PRODUCTS, usingMockData: true },
          { status: 200 }
        );
      }

      const typedData = data as DropProductsData;
      const edges = typedData?.products?.edges ?? [];

      for (const { node } of edges) {
        const variant = node.variants?.edges?.[0]?.node ?? {} as ShopifyVariantNode;

        const mfMap = new Map<string, string>();
        for (const mf of node.metafields ?? []) {
          if (mf?.namespace && mf?.key && mf?.value != null) {
            mfMap.set(`${mf.namespace}/${mf.key}`, mf.value);
          }
        }

        allProducts.push({
          id: node.id,
          title: node.title,
          description: node.description ?? "",
          handle: node.handle,
          status: node.status,
          tags: node.tags ?? [],
          sku: variant.sku ?? "",
          variantId: variant.id ?? "",
          images: (node.images?.edges ?? []).map((e) => ({
            id: e.node.id,
            url: e.node.url,
            altText: e.node.altText ?? null,
          })),
          price: variant.price ?? "0",
          compareAtPrice: variant.compareAtPrice ?? null,
          inventoryQuantity: variant.inventoryQuantity ?? 0,
          cost: mfMap.get("custom/cost") ?? null,
          conditionGrade: mfMap.get("fashionica/condition_grade") ?? null,
          material: mfMap.get("fashionica/material") ?? null,
          hardwareColor: mfMap.get("fashionica/hardware_color") ?? null,
          year: mfMap.get("fashionica/year") ?? null,
          serialNumber: mfMap.get("fashionica/serial_number") ?? null,
          reshootNotes: mfMap.get("fashionica/reshoot_notes") ?? null,
          tiktokPrice: mfMap.get("channels/tiktok_price") ?? null,
          whatnotPrice: mfMap.get("channels/whatnot_price") ?? null,
        });
      }

      hasNextPage = typedData?.products?.pageInfo?.hasNextPage ?? false;
      after = typedData?.products?.pageInfo?.endCursor;
    }

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("Drop products fetch error:", error);
    return NextResponse.json(
      { products: MOCK_PRODUCTS, usingMockData: true },
      { status: 200 }
    );
  }
});
