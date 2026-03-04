"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface SheetData {
  values?: string[][];
}

export default function SheetsPage() {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [range, setRange] = useState("Sheet1");
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchSheet() {
    if (!spreadsheetId.trim()) {
      toast.error("Enter a Spreadsheet ID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/google/sheets?spreadsheetId=${encodeURIComponent(spreadsheetId)}&range=${encodeURIComponent(range)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      toast.success("Sheet loaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load sheet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Google Sheets</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Load Sheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Spreadsheet ID"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="text"
              placeholder="Range (e.g. Sheet1)"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={fetchSheet} disabled={loading}>
              {loading ? "Loading…" : "Load"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Find the spreadsheet ID in the URL: docs.google.com/spreadsheets/d/
            <strong>SPREADSHEET_ID</strong>/edit
          </p>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {data?.values && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {data.values[0]?.map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left font-medium">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.values.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0 hover:bg-muted/30">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
