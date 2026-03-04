import { getShopifyClient } from "@/lib/shopify/client";
import { ORDERS_QUERY } from "@/lib/shopify/queries/orders";
import { OrdersTable } from "@/components/shopify/orders-table";
import type { ShopifyOrder } from "@/types/shopify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getOrders(query?: string) {
  try {
    const client = getShopifyClient();
    const { data } = await client.request(ORDERS_QUERY, {
      variables: { first: 50, query },
    });
    return (data?.orders?.edges ?? []).map(
      (e: { node: ShopifyOrder }) => e.node
    );
  } catch {
    return [];
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const orders = await getOrders(params.q);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
