import { getShopifyClient } from "@/lib/shopify/client";
import { DROPS_CALENDAR_QUERY, DROP_PRODUCTS_QUERY } from "@/lib/shopify/queries/drops";
import { isDropTag, parseDropTag, getDropStatus } from "@/lib/drops/parse-tag";
import { MOCK_DROPS, MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import { db } from "@/lib/db";
import { workflowSignoffs } from "@/lib/db/schema/drops";
import { inArray } from "drizzle-orm";
import type { Channel, DropApiDrop, DropProduct, WorkflowStage } from "@/types/drops";

interface CalendarNode {
  id: string;
  tags: string[];
  status: string;
  totalInventory: number;
}
interface CalendarData {
  products?: {
    edges: Array<{ node: CalendarNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string };
  };
}

interface ShopifyImageEdge {
  node: { id: string; url: string; altText: string | null };
}
interface ShopifyVariantNode {
  id: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
}
interface ShopifyProductNode {
  id: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  tags: string[];
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

const WORKFLOW_STAGES: WorkflowStage[] = [
  "receive",
  "photography",
  "authentication",
  "copy",
  "specs",
  "pricing",
  "channels",
];

export async function getDropsForCalendar(): Promise<{
  drops: DropApiDrop[];
  usingMockData: boolean;
}> {
  if (!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return { drops: MOCK_DROPS, usingMockData: true };
  }

  try {
    const client = await getShopifyClient();
    const allNodes: CalendarNode[] = [];
    let after: string | undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const { data, errors } = await client.request(DROPS_CALENDAR_QUERY, {
        variables: { after },
      });
      if (errors) {
        console.error("Shopify drops calendar error:", errors);
        return { drops: MOCK_DROPS, usingMockData: true };
      }
      const typedData = data as CalendarData;
      const edges = typedData?.products?.edges ?? [];
      allNodes.push(...edges.map((e) => e.node));
      hasNextPage = typedData?.products?.pageInfo?.hasNextPage ?? false;
      after = typedData?.products?.pageInfo?.endCursor;
    }

    const dropMap = new Map<string, { count: number; activeCount: number }>();
    for (const node of allNodes) {
      const dropTagStr = node.tags.find(isDropTag);
      if (!dropTagStr) continue;
      const existing = dropMap.get(dropTagStr) ?? { count: 0, activeCount: 0 };
      existing.count++;
      if (node.status !== "ARCHIVED") existing.activeCount++;
      dropMap.set(dropTagStr, existing);
    }

    const tags = [...dropMap.keys()];

    // Join workflow_signoffs from our DB
    const signoffRows =
      tags.length > 0
        ? await db
            .select()
            .from(workflowSignoffs)
            .where(inArray(workflowSignoffs.dropTag, tags))
        : [];

    const signoffsByTag = new Map<
      string,
      Map<WorkflowStage, { signedOffBy: string; signedOffAt: string; note: string | null }>
    >();
    for (const row of signoffRows) {
      if (!signoffsByTag.has(row.dropTag)) {
        signoffsByTag.set(row.dropTag, new Map());
      }
      signoffsByTag.get(row.dropTag)!.set(row.stage as WorkflowStage, {
        signedOffBy: row.signedOffBy,
        signedOffAt: row.signedOffAt.toISOString(),
        note: row.note,
      });
    }

    const now = new Date();
    const drops: DropApiDrop[] = [];

    for (const [tagStr, { count, activeCount }] of dropMap) {
      const dropTag = parseDropTag(tagStr);
      if (!dropTag) continue;

      const status = getDropStatus(dropTag.date, now);
      const channels: Channel[] = ["shopify"];

      const stageSignoffs = signoffsByTag.get(tagStr);
      const signoffs: DropApiDrop["signoffs"] = {};
      if (stageSignoffs) {
        for (const [stage, data] of stageSignoffs) {
          signoffs[stage] = data;
        }
      }

      const doneCount = stageSignoffs?.size ?? 0;
      const completionPct = Math.round(
        (doneCount / WORKFLOW_STAGES.length) * 100
      );

      drops.push({
        tag: tagStr,
        date: dropTag.date.toISOString(),
        type: dropTag.type,
        name: `Drop ${tagStr}`,
        productCount: count,
        activeCount,
        status,
        channels,
        completionPct,
        signoffs,
      });
    }

    drops.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { drops, usingMockData: false };
  } catch (error) {
    console.error("getDropsForCalendar error:", error);
    return { drops: MOCK_DROPS, usingMockData: true };
  }
}

export async function getDropProducts(tag: string): Promise<{
  products: DropProduct[];
  usingMockData: boolean;
}> {
  if (!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return { products: MOCK_PRODUCTS, usingMockData: true };
  }

  try {
    const client = await getShopifyClient();
    const query = `tag:'${tag}'`;
    const allProducts: DropProduct[] = [];
    let after: string | undefined;
    let hasNextPage = true;

    while (hasNextPage) {
      const { data, errors } = await client.request(DROP_PRODUCTS_QUERY, {
        variables: { tag: query, after },
      });
      if (errors) {
        console.error("Drop products error:", errors);
        return { products: MOCK_PRODUCTS, usingMockData: true };
      }

      const typedData = data as DropProductsData;
      const edges = typedData?.products?.edges ?? [];

      for (const { node } of edges) {
        const variant =
          node.variants?.edges?.[0]?.node ?? ({} as ShopifyVariantNode);
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

    return { products: allProducts, usingMockData: false };
  } catch (error) {
    console.error("getDropProducts error:", error);
    return { products: MOCK_PRODUCTS, usingMockData: true };
  }
}
