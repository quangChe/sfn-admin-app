"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/drops/workspace-context";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct, PriceUpdate } from "@/types/drops";

const TAB_LABEL = "Pricing";

function calcMargin(price: string, cost: string | null): number | null {
  const p = parseFloat(price);
  const c = cost ? parseFloat(cost) : null;
  if (!p || p <= 0 || c === null) return null;
  return ((p - c) / p) * 100;
}

function fmt(val: string | null | undefined): string {
  if (!val || val === "0") return "";
  const n = parseFloat(val);
  return isNaN(n) ? "" : n.toFixed(2);
}

interface SuggestState {
  loading: boolean;
  low?: number;
  mid?: number;
  high?: number;
  error?: string;
}

export default function PricingPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = use(params);
  const tagStr = decodeURIComponent(tag);

  const { reportDirty, registerSaveHandler, registerDiscardHandler } =
    useWorkspace();

  const [products, setProducts] = useState<DropProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [suggests, setSuggests] = useState(new Map<string, SuggestState>());

  // price changes: productId -> { price, compareAtPrice }
  const changesRef = useRef(new Map<string, Partial<PriceUpdate>>());
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  // Fetch products
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/shopify/drops/${encodeURIComponent(tagStr)}`,
        );
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

  // Report dirty count on mount/change
  useEffect(() => {
    reportDirty(changesRef.current.size, TAB_LABEL);
  });

  // Register save/discard handlers
  const save = useCallback(async () => {
    const changes = changesRef.current;
    if (changes.size === 0) return;

    const payload = products
      .filter((p) => changes.has(p.id))
      .map((p) => {
        const c = changes.get(p.id)!;
        return {
          productId: p.id,
          variantId: p.variantId,
          price: c.price ?? p.price,
          compareAtPrice:
            c.compareAtPrice !== undefined
              ? c.compareAtPrice
              : p.compareAtPrice,
        };
      });

    const res = await fetch(
      `/api/shopify/drops/${encodeURIComponent(tagStr)}/bulk`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: payload }),
      },
    );

    if (!res.ok) throw new Error("Save failed");

    // Apply saved prices back into products list
    const savedIds = new Set(payload.map((c) => c.productId));
    setProducts((prev) =>
      prev.map((p) => {
        if (!savedIds.has(p.id)) return p;
        const c = changes.get(p.id)!;
        return {
          ...p,
          price: c.price ?? p.price,
          compareAtPrice:
            c.compareAtPrice !== undefined
              ? c.compareAtPrice
              : p.compareAtPrice,
        };
      }),
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

  function handleChange(
    productId: string,
    field: keyof PriceUpdate,
    value: string,
  ) {
    const prev = changesRef.current.get(productId) ?? {};
    if (value === "" && field === "compareAtPrice") {
      changesRef.current.set(productId, { ...prev, compareAtPrice: null });
    } else {
      changesRef.current.set(productId, { ...prev, [field]: value });
    }
    rerender();
    reportDirty(changesRef.current.size, TAB_LABEL);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    colId: string,
    rowIdx: number,
  ) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const dir = e.shiftKey ? -1 : 1;
    const nextIdx = rowIdx + dir;
    const nextInput = document.querySelector<HTMLInputElement>(
      `[data-col="${colId}"][data-row="${nextIdx}"]`,
    );
    if (nextInput) {
      nextInput.focus();
    } else {
      // wrap around
      const all = document.querySelectorAll<HTMLInputElement>(
        `[data-col="${colId}"]`,
      );
      if (all.length) (dir > 0 ? all[0] : all[all.length - 1]).focus();
    }
  }

  async function handleSuggest(product: DropProduct) {
    setSuggests((prev) => {
      const next = new Map(prev);
      next.set(product.id, { loading: true });
      return next;
    });

    try {
      const res = await fetch("/api/ai/price-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.title,
          productType: "luxury bag",
          imageUrl: product.images[0]?.url,
        }),
      });
      const json = await res.json();
      setSuggests((prev) => {
        const next = new Map(prev);
        next.set(product.id, { loading: false, ...json });
        return next;
      });
    } catch {
      setSuggests((prev) => {
        const next = new Map(prev);
        next.set(product.id, { loading: false, error: "Failed to fetch" });
        return next;
      });
    }
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

      {/* Info cards */}
      <div className="flex gap-3 px-6 py-4">
        <div className="flex-1 rounded-xl border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-800">
                AI Price Suggestions
              </p>
              <p className="text-xs text-purple-600 mt-0.5">
                Click ✨ to get market-based price ranges from Vestiaire, The
                RealReal, eBay, and Google Shopping.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <Search className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Google Lens</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Click 🔍 to visually search the item on Google Lens for
                comparable listings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e5ddd8] bg-[#faf8f5]">
              <th className="sticky left-0 z-10 bg-[#faf8f5] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] min-w-[220px]">
                Product
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Cost
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-28">
                Sell Price
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-28">
                Compare At
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-20">
                Margin
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-14">
                Status
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5ddd8]">
            {products.map((product, rowIdx) => {
              const change = changesRef.current.get(product.id);
              const isDirty = !!change;
              const currentPrice = change?.price ?? product.price;
              const currentCompare =
                change?.compareAtPrice !== undefined
                  ? change.compareAtPrice
                  : product.compareAtPrice;

              const margin = calcMargin(currentPrice, product.cost);
              const isDone = parseFloat(currentPrice) > 0;
              const suggest = suggests.get(product.id);
              const isExpanded = expanded.has(product.id);

              return (
                <div key={product.id}>
                  <tr
                    key={product.id}
                    className={cn(
                      "group transition-colors",
                      isDirty && "bg-[#faf8f5]",
                      !isDirty && "hover:bg-gray-50/50",
                    )}
                  >
                    {/* Product column - sticky */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-gray-50/50",
                        isDirty && "bg-[#faf8f5] group-hover:bg-[#faf8f5]",
                        isDirty && "border-l-2 border-[#5f211b]",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#e5ddd8] bg-[#f2ede9]">
                          {product.images[0] ? (
                            <Image
                              key={product.images[0].id}
                              src={product.images[0].url}
                              alt={product.images[0].altText ?? product.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#8a7a72] text-xs">
                              No img
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm leading-tight truncate max-w-[160px]">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-[#8a7a72] font-mono">
                              {product.sku || "—"}
                            </span>
                            {product.images.length > 1 && (
                              <button
                                onClick={() => toggleExpand(product.id)}
                                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-[#5f211b] hover:bg-[#5f211b]/10 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-2.5 w-2.5" />
                                ) : (
                                  <ChevronDown className="h-2.5 w-2.5" />
                                )}
                                +{product.images.length - 1} img
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 text-right text-sm text-[#8a7a72]">
                      {product.cost
                        ? `$${parseFloat(product.cost).toFixed(0)}`
                        : "—"}
                    </td>

                    {/* Sell Price */}
                    <td
                      className={cn(
                        "px-4 py-3",
                        isDirty && "border-l border-[#5f211b]/20",
                      )}
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={fmt(currentPrice)}
                        data-col="price"
                        data-row={rowIdx}
                        onChange={(e) =>
                          handleChange(product.id, "price", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, "price", rowIdx)}
                        className={cn(
                          "w-24 rounded-md border px-2 py-1 text-right text-sm transition-colors focus:outline-none focus:ring-1",
                          isDirty && change?.price !== undefined
                            ? "border-[#5f211b] bg-[#5f211b]/5 focus:ring-[#5f211b]"
                            : "border-[#e5ddd8] bg-white focus:ring-[#5f211b]",
                        )}
                      />
                    </td>

                    {/* Compare At */}
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="—"
                        value={fmt(currentCompare)}
                        data-col="compare"
                        data-row={rowIdx}
                        onChange={(e) =>
                          handleChange(
                            product.id,
                            "compareAtPrice",
                            e.target.value,
                          )
                        }
                        onKeyDown={(e) => handleKeyDown(e, "compare", rowIdx)}
                        className={cn(
                          "w-24 rounded-md border px-2 py-1 text-right text-sm transition-colors focus:outline-none focus:ring-1",
                          isDirty && change?.compareAtPrice !== undefined
                            ? "border-[#5f211b] bg-[#5f211b]/5 focus:ring-[#5f211b]"
                            : "border-[#e5ddd8] bg-white focus:ring-[#5f211b]",
                        )}
                      />
                    </td>

                    {/* Margin */}
                    <td className="px-4 py-3 text-right">
                      {margin !== null ? (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            margin >= 20 ? "text-[#3d7a5a]" : "text-amber-600",
                          )}
                        >
                          {margin.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-sm text-[#8a7a72]">—</span>
                      )}
                    </td>

                    {/* Status dot */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          isDone ? "bg-[#3d7a5a]" : "bg-[#e5ddd8]",
                        )}
                        title={isDone ? "Price set" : "No price"}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSuggest(product)}
                          disabled={suggest?.loading}
                          title="AI price suggestion"
                          className="flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                        >
                          {suggest?.loading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "✨"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const url = product.images[0]?.url;
                            if (url) {
                              window.open(
                                `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`,
                                "_blank",
                              );
                            }
                          }}
                          disabled={!product.images[0]}
                          title="Google Lens search"
                          className="flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          🔍
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* AI suggestion row */}
                  {suggest &&
                    !suggest.loading &&
                    (suggest.low !== undefined || suggest.error) && (
                      <tr
                        key={`${product.id}-suggest`}
                        className="bg-purple-50/50"
                      >
                        <td
                          colSpan={2}
                          className="sticky left-0 bg-purple-50/50 px-4 pb-3 pt-0"
                        >
                          <span className="text-xs text-purple-600 font-medium">
                            ✨ AI Suggestion
                          </span>
                        </td>
                        <td className="px-4 pb-3 pt-0 text-right">
                          {suggest.error ? (
                            <span className="text-xs text-red-500">
                              {suggest.error}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                handleChange(
                                  product.id,
                                  "price",
                                  String(suggest.mid!),
                                )
                              }
                              className="text-xs text-purple-700 hover:underline font-mono"
                              title="Click to apply mid price"
                            >
                              ${suggest.mid?.toFixed(0)}
                            </button>
                          )}
                        </td>
                        <td className="px-4 pb-3 pt-0 text-right">
                          {!suggest.error && (
                            <span className="text-xs text-purple-500 font-mono">
                              ${suggest.low?.toFixed(0)} – $
                              {suggest.high?.toFixed(0)}
                            </span>
                          )}
                        </td>
                        <td colSpan={3} />
                      </tr>
                    )}

                  {/* Expanded images row */}
                  {isExpanded && product.images.length > 1 && (
                    <tr key={`${product.id}-images`} className="bg-[#faf8f5]">
                      <td colSpan={7} className="px-4 pb-3 pt-2">
                        <div className="flex gap-2 flex-wrap pl-14">
                          {product.images.slice(1).map((img) => (
                            <div
                              key={img.id}
                              className="relative h-20 w-20 overflow-hidden rounded-md border border-[#e5ddd8] bg-[#f2ede9]"
                            >
                              <Image
                                src={img.url}
                                alt={img.altText ?? ""}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
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
