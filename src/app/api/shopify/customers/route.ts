import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopifyClient } from "@/lib/shopify/client";
import { CUSTOMERS_QUERY } from "@/lib/shopify/queries/customers";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const first = Math.min(parseInt(searchParams.get("first") ?? "20"), 100);
  const after = searchParams.get("after") ?? undefined;
  const query = searchParams.get("query") ?? undefined;

  try {
    const client = getShopifyClient();
    const { data, errors } = await client.request(CUSTOMERS_QUERY, {
      variables: { first, after, query },
    });

    if (errors) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Shopify customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
