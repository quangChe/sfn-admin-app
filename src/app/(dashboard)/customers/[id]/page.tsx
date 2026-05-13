import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getShopifyClient } from "@/lib/shopify/client";
import { CUSTOMER_BY_ID_QUERY } from "@/lib/shopify/queries/customers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gid = decodeURIComponent(id);

  let customer;
  try {
    const client = await getShopifyClient();
    const { data } = await client.request(CUSTOMER_BY_ID_QUERY, {
      variables: { id: gid },
    });
    customer = data?.customer;
  } catch {
    notFound();
  }

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/customers"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Customers
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{customer.displayName}</span>
      </div>

      <h2 className="text-2xl font-bold">{customer.displayName}</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.orders?.edges?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.orders?.edges?.map(
                    ({ node }: { node: { id: string; name: string; createdAt: string; displayFinancialStatus: string; totalPriceSet: { shopMoney: { amount: string; currencyCode: string } } } }) => (
                      <div key={node.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <Link
                            href={`/orders/${encodeURIComponent(node.id)}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {node.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(node.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: node.totalPriceSet.shopMoney.currencyCode,
                            }).format(parseFloat(node.totalPriceSet.shopMoney.amount))}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {node.displayFinancialStatus}
                          </Badge>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <p>{customer.email}</p>
              {customer.phone && <p>{customer.phone}</p>}
              <p className="text-muted-foreground">
                Member {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-medium">{customer.numberOfOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: customer.amountSpent.currencyCode,
                  }).format(parseFloat(customer.amountSpent.amount))}
                </span>
              </div>
              {customer.emailMarketingConsent && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marketing</span>
                  <Badge variant="secondary" className="text-xs">
                    {customer.emailMarketingConsent.marketingState}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
          {customer.defaultAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-0.5">
                <p>{customer.defaultAddress.address1}</p>
                {customer.defaultAddress.address2 && <p>{customer.defaultAddress.address2}</p>}
                <p>
                  {customer.defaultAddress.city}, {customer.defaultAddress.province}{" "}
                  {customer.defaultAddress.zip}
                </p>
                <p>{customer.defaultAddress.country}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
