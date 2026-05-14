"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/drops/workspace-context";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct } from "@/types/drops";

const TAB_LABEL = "Media";

interface MediaChange {
  needsReshoot?: boolean;
  notes?: string;
}

export default function MediaPage({
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
  const [expanded, setExpanded] = useState(new Set<string>());

  const changesRef = useRef(new Map<string, MediaChange>());
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
        const originalReshoot = p.tags.includes("needs-reshoot");
        const currentReshoot = c.needsReshoot ?? originalReshoot;

        const addTags: string[] = [];
        const removeTags: string[] = [];
        if (currentReshoot && !originalReshoot) addTags.push("needs-reshoot");
        if (!currentReshoot && originalReshoot) removeTags.push("needs-reshoot");

        return {
          productId: p.id,
          addTags,
          removeTags,
          notes: c.notes !== undefined ? c.notes : undefined,
        };
      });

    const res = await fetch(
      `/api/shopify/drops/${encodeURIComponent(tagStr)}/bulk`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "media", changes: payload }),
      }
    );
    if (!res.ok) throw new Error("Save failed");

    setProducts((prev) =>
      prev.map((p) => {
        const c = changes.get(p.id);
        if (!c) return p;
        const originalReshoot = p.tags.includes("needs-reshoot");
        const currentReshoot = c.needsReshoot ?? originalReshoot;
        const tags = currentReshoot
          ? [...new Set([...p.tags, "needs-reshoot"])]
          : p.tags.filter((t) => t !== "needs-reshoot");
        return {
          ...p,
          tags,
          reshootNotes: c.notes !== undefined ? c.notes : p.reshootNotes,
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

  function handleChange(productId: string, field: keyof MediaChange, value: boolean | string) {
    const prev = changesRef.current.get(productId) ?? {};
    changesRef.current.set(productId, { ...prev, [field]: value });
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
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e5ddd8] bg-[#faf8f5]">
              <th className="sticky left-0 z-10 bg-[#faf8f5] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] min-w-[200px]">
                Product
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Images
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-28">
                Re-shoot
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72]">
                Notes
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
              const isExpanded = expanded.has(product.id);

              const originalReshoot = product.tags.includes("needs-reshoot");
              const currentReshoot = change?.needsReshoot ?? originalReshoot;
              const currentNotes = change?.notes ?? product.reshootNotes ?? "";

              const isDone = product.images.length >= 3 && !currentReshoot;

              return (
                <>
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
                        <button
                          onClick={() => toggleExpand(product.id)}
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#e5ddd8] bg-[#f2ede9] hover:ring-2 hover:ring-[#5f211b]/30 transition-all"
                          title="Click to view all images"
                        >
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
                        </button>
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

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#e5ddd8] px-2 py-1 text-xs font-medium text-[#8a7a72] hover:bg-[#f2ede9] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {product.images.length}
                        {product.images.length < 3 && (
                          <span className="text-amber-600 font-semibold">!</span>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleChange(product.id, "needsReshoot", !currentReshoot)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          currentReshoot
                            ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                            : "bg-[#f2ede9] text-[#8a7a72] border border-[#e5ddd8] hover:bg-[#e5ddd8]"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", currentReshoot ? "bg-red-500" : "bg-[#c5b8b0]")} />
                        {currentReshoot ? "Reshoot" : "OK"}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Reshoot notes…"
                        value={currentNotes}
                        onChange={(e) => handleChange(product.id, "notes", e.target.value)}
                        className={cn(
                          "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                          change?.notes !== undefined
                            ? "border-[#5f211b] bg-[#5f211b]/5"
                            : "border-[#e5ddd8] bg-white"
                        )}
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5 rounded-full",
                          isDone ? "bg-[#3d7a5a]" : "bg-[#e5ddd8]"
                        )}
                        title={
                          isDone
                            ? "Ready"
                            : product.images.length < 3
                            ? `Needs ${3 - product.images.length} more image(s)`
                            : "Flagged for reshoot"
                        }
                      />
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${product.id}-images`} className="bg-[#faf8f5]">
                      <td colSpan={5} className="px-4 pb-3 pt-2">
                        <div className="flex gap-2 flex-wrap pl-14">
                          {product.images.length === 0 && (
                            <p className="text-xs text-[#8a7a72] py-2">No images uploaded</p>
                          )}
                          {product.images.map((img, idx) => (
                            <div
                              key={img.id}
                              className="relative h-20 w-20 overflow-hidden rounded-md border border-[#e5ddd8] bg-[#f2ede9]"
                            >
                              <Image
                                src={img.url}
                                alt={img.altText ?? `Image ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            </div>
                          ))}
                          {product.images.length < 3 && (
                            <div className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed border-amber-300 bg-amber-50 text-[10px] font-medium text-amber-600 text-center px-1">
                              Need {3 - product.images.length} more
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
