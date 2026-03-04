"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShopifyProduct } from "@/types/shopify";

interface ProductsTableProps {
  products: ShopifyProduct[];
  loading?: boolean;
}

export function ProductsTable({ products, loading }: ProductsTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Inventory</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No products found.
            </TableCell>
          </TableRow>
        )}
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  width={32}
                  height={32}
                  className="rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
            </TableCell>
            <TableCell>
              <Link
                href={`/products/${encodeURIComponent(product.id)}`}
                className="font-medium hover:underline"
              >
                {product.title}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {product.productType || "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">{product.vendor}</TableCell>
            <TableCell>{product.totalInventory}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell className="text-right font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: product.priceRangeV2.minVariantPrice.currencyCode,
              }).format(
                parseFloat(product.priceRangeV2.minVariantPrice.amount)
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
