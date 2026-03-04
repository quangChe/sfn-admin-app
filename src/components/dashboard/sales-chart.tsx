"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface SalesChartProps {
  data: Array<{ date: string; sales: number }>;
  currency?: string;
}

export function SalesChart({ data, currency = "USD" }: SalesChartProps) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                try {
                  return format(parseISO(v), "MMM d");
                } catch {
                  return v;
                }
              }}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tickFormatter={(v) => formatter.format(v)}
              tick={{ fontSize: 12 }}
              width={70}
            />
            <Tooltip
              formatter={(value: number) => [formatter.format(value), "Sales"]}
              labelFormatter={(label) => {
                try {
                  return format(parseISO(label as string), "PPP");
                } catch {
                  return label;
                }
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
