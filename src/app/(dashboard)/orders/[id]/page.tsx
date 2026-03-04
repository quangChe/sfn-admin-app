import { notFound } from "next/navigation";
import Link from "next/link";
import { getShopifyClient } from "@/lib/shopify/client";
import { ORDER_BY_ID_QUERY } from "@/lib/shopify/queries/orders";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gid = decodeURIComponent(id);

  let order;
  try {
    const client = getShopifyClient();
    const { data } = await client.request(ORDER_BY_ID_QUERY, {
      variables: { id: gid },
    });
    order = data?.order;
  } catch {
    notFound();
  }

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{order.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold">{order.name}</h2>
        <div className="flex gap-2">
          <Badge>{order.displayFinancialStatus}</Badge>
          <Badge variant="secondary">{order.displayFulfillmentStatus}</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.lineItems?.edges?.map(
                  ({ node }: { node: { id: string; title: string; sku?: string; quantity: number; originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } }; variant?: { image?: { url: string; altText?: string } } } }) => (
                    <div key={node.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{node.title}</p>
                        {node.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {node.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: node.originalUnitPriceSet.shopMoney.currencyCode,
                          }).format(parseFloat(node.originalUnitPriceSet.shopMoney.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">× {node.quantity}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="mt-4 flex justify-end font-bold">
                Total:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: order.totalPriceSet.shopMoney.currencyCode,
                }).format(parseFloat(order.totalPriceSet.shopMoney.amount))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {order.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.customer.displayName}</p>
                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                {order.customer.phone && (
                  <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                )}
              </CardContent>
            </Card>
          )}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-0.5">
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                  {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
