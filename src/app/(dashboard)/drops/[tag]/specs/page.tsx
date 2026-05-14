"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/components/drops/workspace-context";
import { MOCK_PRODUCTS } from "@/lib/drops/mock-data";
import type { DropProduct } from "@/types/drops";

const TAB_LABEL = "Specs";

interface SpecsChange {
  conditionGrade?: string;
  material?: string;
  hardwareColor?: string;
  year?: string;
  serialNumber?: string;
}

const CONDITION_GRADES = ["A", "B", "C"] as const;

export default function SpecsPage({
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

  const changesRef = useRef(new Map<string, SpecsChange>());
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
        const metafields: Array<{
          namespace: string;
          key: string;
          value: string;
          type: string;
        }> = [];

        if (c.conditionGrade !== undefined)
          metafields.push({ namespace: "fashionica", key: "condition_grade", value: c.conditionGrade, type: "single_line_text_field" });
        if (c.material !== undefined)
          metafields.push({ namespace: "fashionica", key: "material", value: c.material, type: "single_line_text_field" });
        if (c.hardwareColor !== undefined)
          metafields.push({ namespace: "fashionica", key: "hardware_color", value: c.hardwareColor, type: "single_line_text_field" });
        if (c.year !== undefined)
          metafields.push({ namespace: "fashionica", key: "year", value: c.year, type: "number_integer" });
        if (c.serialNumber !== undefined)
          metafields.push({ namespace: "fashionica", key: "serial_number", value: c.serialNumber, type: "single_line_text_field" });

        return { productId: p.id, metafields };
      })
      .filter((item) => item.metafields.length > 0);

    if (payload.length === 0) return;

    const res = await fetch(
      `/api/shopify/drops/${encodeURIComponent(tagStr)}/bulk`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "specs", changes: payload }),
      }
    );
    if (!res.ok) throw new Error("Save failed");

    setProducts((prev) =>
      prev.map((p) => {
        const c = changes.get(p.id);
        if (!c) return p;
        return {
          ...p,
          conditionGrade: c.conditionGrade ?? p.conditionGrade,
          material: c.material ?? p.material,
          hardwareColor: c.hardwareColor ?? p.hardwareColor,
          year: c.year ?? p.year,
          serialNumber: c.serialNumber ?? p.serialNumber,
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

  function handleChange(productId: string, field: keyof SpecsChange, value: string) {
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
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e5ddd8] bg-[#faf8f5]">
              <th className="sticky left-0 z-10 bg-[#faf8f5] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] min-w-[200px]">
                Product
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-28">
                Condition
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-36">
                Material
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-32">
                Hardware
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-24">
                Year
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[#8a7a72] w-36">
                Serial No.
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

              const currentGrade = change?.conditionGrade ?? product.conditionGrade ?? "";
              const currentMaterial = change?.material ?? product.material ?? "";
              const currentHardware = change?.hardwareColor ?? product.hardwareColor ?? "";
              const currentYear = change?.year ?? product.year ?? "";
              const currentSerial = change?.serialNumber ?? product.serialNumber ?? "";

              const isDone = currentGrade.length > 0;

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

                  <td className="px-4 py-3">
                    <select
                      value={currentGrade}
                      onChange={(e) => handleChange(product.id, "conditionGrade", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b] bg-white",
                        change?.conditionGrade !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8]"
                      )}
                    >
                      <option value="">—</option>
                      {CONDITION_GRADES.map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="e.g. Canvas"
                      value={currentMaterial}
                      onChange={(e) => handleChange(product.id, "material", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        change?.material !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="e.g. Gold"
                      value={currentHardware}
                      onChange={(e) => handleChange(product.id, "hardwareColor", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        change?.hardwareColor !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="1900"
                      max="2099"
                      placeholder="2024"
                      value={currentYear}
                      onChange={(e) => handleChange(product.id, "year", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        change?.year !== undefined
                          ? "border-[#5f211b] bg-[#5f211b]/5"
                          : "border-[#e5ddd8] bg-white"
                      )}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="—"
                      value={currentSerial}
                      onChange={(e) => handleChange(product.id, "serialNumber", e.target.value)}
                      className={cn(
                        "w-full rounded-md border px-2 py-1.5 text-sm font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-[#5f211b]",
                        change?.serialNumber !== undefined
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
                      title={isDone ? "Condition set" : "Missing condition grade"}
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
