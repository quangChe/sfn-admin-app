"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/drops/workspace-context";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct } from "@/types/drops";

const TAB_LABEL = "Copy";

interface CopyChange {
  title?: string;
  description?: string;
}

export default function CopyPage({
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

  const changesRef = useRef(new Map<string, CopyChange>());
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
        const title = c.title ?? p.title;
        const desc = c.description ?? p.description;
        return {
          productId: p.id,
          title,
          descriptionHtml: desc ? `<p>${desc.replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>")}</p>` : "",
        };
      });

    const res = await fetch(
      `/api/shopify/drops/${encodeURIComponent(tagStr)}/bulk`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "copy", changes: payload }),
      }
    );
    if (!res.ok) throw new Error("Save failed");

    setProducts((prev) =>
      prev.map((p) => {
        const c = changes.get(p.id);
        if (!c) return p;
        return {
          ...p,
          title: c.title ?? p.title,
          description: c.description ?? p.description,
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

  function handleChange(productId: string, field: keyof CopyChange, value: string) {
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
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-60">
                Title
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72]">
                Description / Condition Notes
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
              const currentTitle = change?.title ?? product.title;
              const currentDesc = change?.description ?? product.description;
              const isDone = currentTitle.trim().length > 0 && currentDesc.trim().length > 0;
              const charsLeft = 255 - currentTitle.length;

              return (
                <tr
                  key={product.id}
                  className={cn(
                    "group transition-colors align-top",
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

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        maxLength={255}
                        value={currentTitle}
                        onChange={(e) => handleChange(product.id, "title", e.target.value)}
                        className={cn(
                          "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                          change?.title !== undefined
                            ? "border-[#5f211b] bg-[#5f211b]/5"
                            : "border-[#e5ddd8] bg-white"
                        )}
                      />
                      {charsLeft <= 20 && (
                        <span
                          className={cn(
                            "text-[10px] text-right",
                            charsLeft <= 5 ? "text-red-500" : "text-amber-600"
                          )}
                        >
                          {charsLeft} chars left
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <textarea
                      rows={3}
                      placeholder="Condition notes, description…"
                      value={currentDesc}
                      onChange={(e) => handleChange(product.id, "description", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm resize-none transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        change?.description !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  <td className="px-4 py-3 text-center pt-5">
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        isDone ? "bg-[#3d7a5a]" : "bg-[#e5ddd8]"
                      )}
                      title={isDone ? "Complete" : "Incomplete"}
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
