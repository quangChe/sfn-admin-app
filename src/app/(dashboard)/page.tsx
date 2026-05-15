import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { getShopifyClient } from "@/lib/shopify/client";
import {
  ANALYTICS_ORDERS_QUERY,
  SHOP_INFO_QUERY,
} from "@/lib/shopify/queries/analytics";

async function getAnalytics() {
  try {
    const client = await getShopifyClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const query = `created_at:>=${since.toISOString().split("T")[0]}`;

    const [shopResult, ordersResult] = await Promise.all([
      client.request(SHOP_INFO_QUERY),
      client.request(ANALYTICS_ORDERS_QUERY, {
        variables: { first: 250, query },
      }),
    ]);

    const orders = ordersResult.data?.orders?.edges ?? [];
    const currency = shopResult.data?.shop?.currencyCode ?? "USD";
    const totalOrders = orders.length;
    const totalSales = orders.reduce(
      (sum: number, edge: { node: { totalPriceSet: { shopMoney: { amount: string } } } }) =>
        sum + parseFloat(edge.node.totalPriceSet?.shopMoney?.amount ?? "0"),
      0
    );

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

    return {
      totalSales: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(totalSales),
      totalOrders: totalOrders.toString(),
      avgOrder:
        totalOrders > 0
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(totalSales / totalOrders)
          : "$0",
      currency,
      chartData,
    };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getSession(await headers());
  const analytics = await getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s your store overview for the last 30 days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Revenue"
          value={analytics?.totalSales ?? "—"}
          description="Last 30 days"
          loading={!analytics}
        />
        <SummaryCard
          title="Total Orders"
          value={analytics?.totalOrders ?? "—"}
          description="Last 30 days"
          loading={!analytics}
        />
        <SummaryCard
          title="Avg. Order Value"
          value={analytics?.avgOrder ?? "—"}
          description="Last 30 days"
          loading={!analytics}
        />
      </div>

      {analytics && analytics.chartData.length > 0 && (
        <SalesChart data={analytics.chartData} currency={analytics.currency} />
      )}
    </div>
  );
}
