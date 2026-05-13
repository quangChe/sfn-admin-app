import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopifyClient } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries/products";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const first = Math.min(parseInt(searchParams.get("first") ?? "20"), 100);
  const after = searchParams.get("after") ?? undefined;
  const query = searchParams.get("query") ?? undefined;

  try {
    const client = await getShopifyClient();
    const { data, errors } = await client.request(PRODUCTS_QUERY, {
      variables: { first, after, query },
    });

    if (errors) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Shopify products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
});
