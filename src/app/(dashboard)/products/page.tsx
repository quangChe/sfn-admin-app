import { getShopifyClient } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries/products";
import { ProductsTable } from "@/components/shopify/products-table";
import type { ShopifyProduct } from "@/types/shopify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getProducts(query?: string) {
  try {
    const client = getShopifyClient();
    const { data } = await client.request(PRODUCTS_QUERY, {
      variables: { first: 50, query },
    });
    return (data?.products?.edges ?? []).map(
      (e: { node: ShopifyProduct }) => e.node
    );
  } catch {
    return [];
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts(params.q);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Products</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Catalog</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProductsTable products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
