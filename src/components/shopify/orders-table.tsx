"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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
import type { ShopifyOrder } from "@/types/shopify";

interface OrdersTableProps {
  orders: ShopifyOrder[];
  loading?: boolean;
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "fulfilled") return "default";
  if (s === "pending" || s === "unfulfilled") return "secondary";
  if (s === "refunded" || s === "voided" || s === "cancelled") return "destructive";
  return "outline";
}

export function OrdersTable({ orders, loading }: OrdersTableProps) {
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
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Fulfillment</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No orders found.
            </TableCell>
          </TableRow>
        )}
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                className="font-medium hover:underline"
              >
                {order.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {order.customer?.displayName ?? order.email ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(order.displayFinancialStatus)}>
                {order.displayFinancialStatus}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(order.displayFulfillmentStatus)}>
                {order.displayFulfillmentStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: order.totalPriceSet.shopMoney.currencyCode,
              }).format(parseFloat(order.totalPriceSet.shopMoney.amount))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
