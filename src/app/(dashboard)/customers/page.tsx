import { getShopifyClient } from "@/lib/shopify/client";
import { CUSTOMERS_QUERY } from "@/lib/shopify/queries/customers";
import { CustomersTable } from "@/components/shopify/customers-table";
import type { ShopifyCustomer } from "@/types/shopify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getCustomers(query?: string) {
  try {
    const client = await getShopifyClient();
    const { data } = await client.request(CUSTOMERS_QUERY, {
      variables: { first: 50, query },
    });
    return (data?.customers?.edges ?? []).map(
      (e: { node: ShopifyCustomer }) => e.node
    );
  } catch {
    return [];
  }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers(params.q);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CustomersTable customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
