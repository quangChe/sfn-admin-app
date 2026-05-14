"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/drops/workspace-context";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct } from "@/types/drops";

const TAB_LABEL = "Channels";

interface ChannelChange {
  tiktok?: boolean;
  whatnot?: boolean;
  tiktokPrice?: string;
  whatnotPrice?: string;
}

export default function ChannelsPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = use(params);
  const tagStr = decodeURIComponent(tag);

  const { reportDirty, registerSaveHandler, registerDiscardHandler } = useWorkspace();

  const [products, setProducts] = useState<DropProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const changesRef = useRef(new Map<string, ChannelChange>());
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/shopify/drops/${encodeURIComponent(tagStr)}`);
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        setProducts(json.products ?? []);
        if (json.usingMockData) setUsingMockData(true);
      } catch {
        setProducts(MOCK_PRODUCTS);
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [tagStr]);

  useEffect(() => {
    reportDirty(changesRef.current.size, TAB_LABEL);
  });

  const save = useCallback(async () => {
    const changes = changesRef.current;
    if (changes.size === 0) return;

    const payload = products
      .filter((p) => changes.has(p.id))
      .map((p) => {
        const c = changes.get(p.id)!;
        const origTiktok = p.tags.includes("tiktok-sync");
        const origWhatnot = p.tags.includes("whatnot-sync");
        const curTiktok = c.tiktok ?? origTiktok;
        const curWhatnot = c.whatnot ?? origWhatnot;

        const addTags: string[] = [];
        const removeTags: string[] = [];
        if (curTiktok && !origTiktok) addTags.push("tiktok-sync");
        if (!curTiktok && origTiktok) removeTags.push("tiktok-sync");
        if (curWhatnot && !origWhatnot) addTags.push("whatnot-sync");
        if (!curWhatnot && origWhatnot) removeTags.push("whatnot-sync");

        const metafields: Array<{
          namespace: string;
          key: string;
          value: string;
          type: string;
        }> = [];

        if (c.tiktokPrice !== undefined)
          metafields.push({ namespace: "channels", key: "tiktok_price", value: c.tiktokPrice, type: "number_decimal" });
        if (c.whatnotPrice !== undefined)
          metafields.push({ namespace: "channels", key: "whatnot_price", value: c.whatnotPrice, type: "number_decimal" });

        return { productId: p.id, addTags, removeTags, metafields };
      });

    const res = await fetch(
      `/api/shopify/drops/${encodeURIComponent(tagStr)}/bulk`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "channels", changes: payload }),
      }
    );
    if (!res.ok) throw new Error("Save failed");

    setProducts((prev) =>
      prev.map((p) => {
        const c = changes.get(p.id);
        if (!c) return p;
        const origTiktok = p.tags.includes("tiktok-sync");
        const origWhatnot = p.tags.includes("whatnot-sync");
        const curTiktok = c.tiktok ?? origTiktok;
        const curWhatnot = c.whatnot ?? origWhatnot;

        let tags = [...p.tags];
        if (curTiktok) tags = [...new Set([...tags, "tiktok-sync"])];
        else tags = tags.filter((t) => t !== "tiktok-sync");
        if (curWhatnot) tags = [...new Set([...tags, "whatnot-sync"])];
        else tags = tags.filter((t) => t !== "whatnot-sync");

        return {
          ...p,
          tags,
          tiktokPrice: c.tiktokPrice ?? p.tiktokPrice,
          whatnotPrice: c.whatnotPrice ?? p.whatnotPrice,
        };
      })
    );
    changesRef.current = new Map();
    rerender();
  }, [products, tagStr]);

  const discard = useCallback(() => {
    changesRef.current = new Map();
    rerender();
  }, []);

  useEffect(() => {
    registerSaveHandler(save);
    registerDiscardHandler(discard);
    return () => {
      registerSaveHandler(null);
      registerDiscardHandler(null);
    };
  }, [registerSaveHandler, registerDiscardHandler, save, discard]);

  function handleChange(productId: string, field: keyof ChannelChange, value: boolean | string) {
    const prev = changesRef.current.get(productId) ?? {};
    changesRef.current.set(productId, { ...prev, [field]: value });
    rerender();
    reportDirty(changesRef.current.size, TAB_LABEL);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8a7a72]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading products…
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {usingMockData && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Using mock data — Shopify API unavailable
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e5ddd8] bg-[#faf8f5]">
              <th className="sticky left-0 z-10 bg-[#faf8f5] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] min-w-[200px]">
                Product
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Shopify
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                TikTok
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-32">
                TikTok $
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Whatnot
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-32">
                Whatnot $
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-14">
                Done
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5ddd8]">
            {products.map((product) => {
              const change = changesRef.current.get(product.id);
              const isDirty = !!change;

              const currentTiktok = change?.tiktok ?? product.tags.includes("tiktok-sync");
              const currentWhatnot = change?.whatnot ?? product.tags.includes("whatnot-sync");
              const currentTiktokPrice = change?.tiktokPrice ?? product.tiktokPrice ?? "";
              const currentWhatnotPrice = change?.whatnotPrice ?? product.whatnotPrice ?? "";

              const isDone = currentTiktok || currentWhatnot;

              return (
                <tr
                  key={product.id}
                  className={cn(
                    "group transition-colors",
                    isDirty ? "bg-[#faf8f5]" : "hover:bg-gray-50/50"
                  )}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-gray-50/50",
                      isDirty && "bg-[#faf8f5] group-hover:bg-[#faf8f5] border-l-2 border-[#5f211b]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#e5ddd8] bg-[#f2ede9]">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].altText ?? product.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-[#8a7a72]">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 text-xs leading-tight truncate max-w-[140px]">
                          {product.title}
                        </p>
                        <span className="text-[11px] text-[#8a7a72] font-mono">
                          {product.sku || "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Shopify — always on */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#96bf48]/15 px-2 py-1 text-xs font-medium text-[#5a7a22]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5a7a22]" />
                      On
                    </span>
                  </td>

                  {/* TikTok toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleChange(product.id, "tiktok", !currentTiktok)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                        currentTiktok
                          ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-700"
                          : "bg-white text-[#8a7a72] border-[#e5ddd8] hover:bg-[#f2ede9]"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", currentTiktok ? "bg-white" : "bg-[#c5b8b0]")} />
                      {currentTiktok ? "On" : "Off"}
                    </button>
                  </td>

                  {/* TikTok price */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="—"
                      value={currentTiktokPrice}
                      disabled={!currentTiktok}
                      onChange={(e) => handleChange(product.id, "tiktokPrice", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-right text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        !currentTiktok && "opacity-40 cursor-not-allowed",
                        change?.tiktokPrice !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  {/* Whatnot toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleChange(product.id, "whatnot", !currentWhatnot)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
                        currentWhatnot
                          ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                          : "bg-white text-[#8a7a72] border-[#e5ddd8] hover:bg-[#f2ede9]"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", currentWhatnot ? "bg-white" : "bg-[#c5b8b0]")} />
                      {currentWhatnot ? "On" : "Off"}
                    </button>
                  </td>

                  {/* Whatnot price */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="—"
                      value={currentWhatnotPrice}
                      disabled={!currentWhatnot}
                      onChange={(e) => handleChange(product.id, "whatnotPrice", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-right text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        !currentWhatnot && "opacity-40 cursor-not-allowed",
                        change?.whatnotPrice !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  {/* Status dot */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        isDone ? "bg-[#3d7a5a]" : "bg-[#e5ddd8]"
                      )}
                      title={isDone ? "Synced to channel" : "No additional channels enabled"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="py-16 text-center text-[#8a7a72] text-sm">
            No products in this drop
          </div>
        )}
      </div>
    </div>
  );
}
