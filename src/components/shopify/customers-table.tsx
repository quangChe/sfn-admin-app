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
import type { ShopifyCustomer } from "@/types/shopify";

interface CustomersTableProps {
  customers: ShopifyCustomer[];
  loading?: boolean;
}

export function CustomersTable({ customers, loading }: CustomersTableProps) {
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
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Marketing</TableHead>
          <TableHead>Member Since</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No customers found.
            </TableCell>
          </TableRow>
        )}
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <Link
                href={`/customers/${encodeURIComponent(customer.id)}`}
                className="font-medium hover:underline"
              >
                {customer.displayName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{customer.email}</TableCell>
            <TableCell>{customer.numberOfOrders}</TableCell>
            <TableCell className="font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: customer.amountSpent.currencyCode,
              }).format(parseFloat(customer.amountSpent.amount))}
            </TableCell>
            <TableCell>
              {customer.emailMarketingConsent && (
                <Badge
                  variant={
                    customer.emailMarketingConsent.marketingState === "SUBSCRIBED"
                      ? "default"
                      : "secondary"
                  }
                >
                  {customer.emailMarketingConsent.marketingState}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(new Date(customer.createdAt), {
                addSuffix: true,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
