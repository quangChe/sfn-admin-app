import { getShopifyClient } from "@/lib/shopify/client";
import {
  ANALYTICS_ORDERS_QUERY,
  SHOP_INFO_QUERY,
} from "@/lib/shopify/queries/analytics";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getAnalytics(days: number) {
  try {
    const client = getShopifyClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
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

    return { totalSales, totalOrders, currency, chartData };
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const [data30, data7] = await Promise.all([
    getAnalytics(30),
    getAnalytics(7),
  ]);

  const fmt = (val: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>

      <Tabs defaultValue="30d">
        <TabsList>
          <TabsTrigger value="7d">7 days</TabsTrigger>
          <TabsTrigger value="30d">30 days</TabsTrigger>
        </TabsList>

        <TabsContent value="30d" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Revenue"
              value={data30 ? fmt(data30.totalSales, data30.currency) : "—"}
              description="Last 30 days"
            />
            <SummaryCard
              title="Orders"
              value={data30?.totalOrders.toString() ?? "—"}
              description="Last 30 days"
            />
            <SummaryCard
              title="Avg. Order"
              value={
                data30 && data30.totalOrders > 0
                  ? fmt(data30.totalSales / data30.totalOrders, data30.currency)
                  : "—"
              }
              description="Last 30 days"
            />
          </div>
          {data30 && data30.chartData.length > 0 && (
            <SalesChart data={data30.chartData} currency={data30.currency} />
          )}
        </TabsContent>

        <TabsContent value="7d" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Revenue"
              value={data7 ? fmt(data7.totalSales, data7.currency) : "—"}
              description="Last 7 days"
            />
            <SummaryCard
              title="Orders"
              value={data7?.totalOrders.toString() ?? "—"}
              description="Last 7 days"
            />
            <SummaryCard
              title="Avg. Order"
              value={
                data7 && data7.totalOrders > 0
                  ? fmt(data7.totalSales / data7.totalOrders, data7.currency)
                  : "—"
              }
              description="Last 7 days"
            />
          </div>
          {data7 && data7.chartData.length > 0 && (
            <SalesChart data={data7.chartData} currency={data7.currency} />
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">More analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional analytics (top products, customer segments, etc.) can be added here by extending the analytics queries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
