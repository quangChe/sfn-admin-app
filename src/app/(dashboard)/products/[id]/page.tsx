import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getShopifyClient } from "@/lib/shopify/client";
import { PRODUCT_BY_ID_QUERY } from "@/lib/shopify/queries/products";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gid = decodeURIComponent(id);

  let product;
  try {
    const client = await getShopifyClient();
    const { data } = await client.request(PRODUCT_BY_ID_QUERY, {
      variables: { id: gid },
    });
    product = data?.product;
  } catch {
    notFound();
  }

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Products
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{product.title}</span>
      </div>

      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold">{product.title}</h2>
        <Badge
          variant={
            product.status === "ACTIVE"
              ? "default"
              : product.status === "DRAFT"
              ? "secondary"
              : "outline"
          }
        >
          {product.status}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.variants?.edges?.map(
                  ({ node }: { node: { id: string; title: string; sku?: string; price: string; inventoryQuantity: number; selectedOptions: Array<{ name: string; value: string }> } }) => (
                    <div key={node.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{node.title}</p>
                        {node.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {node.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${node.price}</p>
                        <p className="text-xs text-muted-foreground">
                          {node.inventoryQuantity} in stock
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {product.featuredImage && (
            <Card>
              <CardContent className="p-3">
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  width={300}
                  height={300}
                  className="w-full rounded-md object-cover"
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor</span>
                <span>{product.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{product.productType || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory</span>
                <span>{product.totalInventory}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
