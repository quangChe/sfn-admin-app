import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopifyClient } from "@/lib/shopify/client";
import {
  ANALYTICS_ORDERS_QUERY,
  SHOP_INFO_QUERY,
} from "@/lib/shopify/queries/analytics";

export const GET = auth(async (req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const query = `created_at:>=${since.toISOString().split("T")[0]}`;

  try {
    const client = await getShopifyClient();

    const [shopResult, ordersResult] = await Promise.all([
      client.request(SHOP_INFO_QUERY),
      client.request(ANALYTICS_ORDERS_QUERY, {
        variables: { first: 250, query },
      }),
    ]);

    if (shopResult.errors || ordersResult.errors) {
      return NextResponse.json(
        { error: shopResult.errors ?? ordersResult.errors },
        { status: 400 }
      );
    }

    const orders = ordersResult.data?.orders?.edges ?? [];
    const currency =
      shopResult.data?.shop?.currencyCode ?? "USD";

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum: number, edge: { node: { totalPriceSet: { shopMoney: { amount: string } } } }) => {
      return sum + parseFloat(edge.node.totalPriceSet?.shopMoney?.amount ?? "0");
    }, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Build daily sales chart data
    const dailySales: Record<string, number> = {};
    orders.forEach((edge: { node: { createdAt: string; totalPriceSet: { shopMoney: { amount: string } } } }) => {
      const date = edge.node.createdAt.split("T")[0];
      dailySales[date] =
        (dailySales[date] ?? 0) +
        parseFloat(edge.node.totalPriceSet?.shopMoney?.amount ?? "0");
    });

    const chartData = Object.entries(dailySales)
      .map(([date, sales]) => ({ date, sales }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        totalSales: totalSales.toFixed(2),
        totalOrders,
        averageOrderValue: averageOrderValue.toFixed(2),
        currency,
        period: `${days} days`,
      },
      chartData,
      shop: shopResult.data?.shop,
    });
  } catch (error) {
    console.error("Shopify analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
});
