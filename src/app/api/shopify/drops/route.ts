import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopifyClient } from "@/lib/shopify/client";
import { DROPS_CALENDAR_QUERY } from "@/lib/shopify/queries/drops";
import { isDropTag, parseDropTag, getDropStatus } from "@/lib/drops/parse-tag";
import { MOCK_DROPS } from "@/lib/drops/mock-data";
import type { Channel, DropApiDrop } from "@/types/drops";

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

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        return NextResponse.json(
          { drops: MOCK_DROPS, usingMockData: true },
          { status: 200 }
        );
      }

      const typedData = data as CalendarData;
      const edges = typedData?.products?.edges ?? [];
      allNodes.push(...edges.map((e) => e.node));
      hasNextPage = typedData?.products?.pageInfo?.hasNextPage ?? false;
      after = typedData?.products?.pageInfo?.endCursor;
    }

    const dropMap = new Map<string, { count: number; activeCount: number }>();

    for (const node of allNodes) {
      const dropTagStr = (node.tags as string[]).find(isDropTag);
      if (!dropTagStr) continue;

      const existing = dropMap.get(dropTagStr) ?? {
        count: 0,
        activeCount: 0,
      };
      existing.count++;
      if (node.status !== "ARCHIVED") existing.activeCount++;
      dropMap.set(dropTagStr, existing);
    }

    const now = new Date();
    const drops: DropApiDrop[] = [];

    for (const [tagStr, { count, activeCount }] of dropMap) {
      const dropTag = parseDropTag(tagStr);
      if (!dropTag) continue;

      const status = getDropStatus(dropTag.date, now);
      const channels: Channel[] = ["shopify"];

      drops.push({
        tag: tagStr,
        date: dropTag.date.toISOString(),
        type: dropTag.type,
        name: `Drop ${tagStr}`,
        productCount: count,
        activeCount,
        status,
        channels,
        completionPct: 0,
      });
    }

    drops.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ drops });
  } catch (error) {
    console.error("Shopify drops error:", error);
    return NextResponse.json(
      { drops: MOCK_DROPS, usingMockData: true },
      { status: 200 }
    );
  }
});
