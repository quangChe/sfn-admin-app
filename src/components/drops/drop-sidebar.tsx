"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DropApiDrop } from "@/types/drops";

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  live: {
    label: "Live",
    className: "bg-[#5f211b] text-white",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-amber-100 text-amber-800",
  },
  draft: {
    label: "Draft",
    className: "bg-[#f2ede9] text-[#8a7a72]",
  },
  future: {
    label: "Future",
    className: "bg-blue-50 text-blue-700",
  },
  ended: {
    label: "Ended",
    className: "bg-gray-100 text-gray-500",
  },
};

const CHANNEL_LABELS: Record<string, { label: string; color: string }> = {
  shopify: { label: "Shopify", color: "bg-[#96bf48]/15 text-[#5a7a22]" },
  tiktok: { label: "TikTok", color: "bg-gray-100 text-gray-600" },
  whatnot: { label: "Whatnot", color: "bg-purple-50 text-purple-700" },
};

interface Props {
  drops: DropApiDrop[];
}

export function DropSidebar({ drops }: Props) {
  const router = useRouter();

  const visible = drops
    .filter((d) => d.status !== "ended")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="w-[280px] shrink-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8a7a72]">
          Upcoming Drops
        </h3>
        <span className="text-xs text-[#8a7a72]">{visible.length}</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
        {visible.length === 0 && (
          <p className="text-sm text-[#8a7a72] py-4 text-center">
            No upcoming drops
          </p>
        )}

        {visible.map((drop) => {
          const badge = STATUS_BADGE[drop.status];
          const date = new Date(drop.date);
          const monthDay = date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={drop.tag}
              onClick={() => router.push(`/drops/${drop.tag}`)}
              className="group cursor-pointer rounded-xl border border-[#e5ddd8] bg-white p-4 hover:border-[#5f211b]/30 hover:shadow-sm transition-all"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span
                    className="text-lg font-semibold text-[#5f211b] leading-tight"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {monthDay}
                  </span>
                  <span className="ml-1.5 text-xs text-[#8a7a72] font-mono">
                    {drop.tag}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              </div>

              {/* Name */}
              <p className="text-sm font-medium text-gray-800 mb-2 truncate">
                {drop.name}
              </p>

              {/* Item count */}
              <p className="text-xs text-[#8a7a72] mb-3">
                {drop.activeCount > 0
                  ? `${drop.activeCount} active item${drop.activeCount !== 1 ? "s" : ""}`
                  : "No items yet"}
              </p>

              {/* Progress bar */}
              {drop.productCount > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-[#8a7a72] mb-1">
                    <span>Readiness</span>
                    <span>{drop.completionPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f2ede9] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5f211b] transition-all"
                      style={{ width: `${drop.completionPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Channel pills */}
              <div className="flex flex-wrap gap-1">
                {drop.channels.map((ch) => {
                  const { label, color } = CHANNEL_LABELS[ch] ?? {
                    label: ch,
                    color: "bg-gray-100 text-gray-500",
                  };
                  return (
                    <span
                      key={ch}
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                        color
                      )}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
