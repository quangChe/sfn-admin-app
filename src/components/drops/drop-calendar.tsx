"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DropApiDrop } from "@/types/drops";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  live: "bg-[#5f211b] text-white",
  upcoming: "bg-[#5f211b]/15 text-[#5f211b]",
  draft: "bg-[#f2ede9] text-[#8a7a72]",
  ended: "bg-[#f2ede9] text-[#8a7a72]",
  future: "bg-[#f2ede9] text-[#8a7a72]",
};

const DOT_COLORS: Record<string, string> = {
  live: "bg-[#5f211b]",
  upcoming: "bg-[#5f211b]",
  draft: "bg-[#8a7a72]",
  ended: "bg-[#e5ddd8]",
  future: "bg-[#e5ddd8]",
};

interface Props {
  drops: DropApiDrop[];
  initialYear?: number;
  initialMonth?: number;
}

export function DropCalendar({ drops, initialYear, initialMonth }: Props) {
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());

  const dropsByDate = new Map<string, DropApiDrop>();
  for (const drop of drops) {
    const d = new Date(drop.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dropsByDate.set(key, drop);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
  });

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Month header */}
      <div className="mb-5 flex items-center justify-between">
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {monthName} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5ddd8] bg-white text-[#8a7a72] hover:bg-[#f2ede9] hover:text-[#5f211b] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5ddd8] bg-white text-[#8a7a72] hover:bg-[#f2ede9] hover:text-[#5f211b] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-[#8a7a72]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-[#e5ddd8] rounded-xl overflow-hidden border border-[#e5ddd8]">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-[#faf8f5] min-h-[80px]" />;
          }

          const key = `${year}-${month}-${day}`;
          const drop = dropsByDate.get(key);
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          return (
            <div
              key={key}
              onClick={() => drop && router.push(`/drops/${drop.tag}`)}
              className={cn(
                "relative bg-white min-h-[80px] p-2 transition-colors",
                drop && "cursor-pointer hover:bg-[#faf8f5]",
                drop?.status === "live" && "bg-[#5f211b]/5",
                drop?.status === "upcoming" && "bg-[#5f211b]/5",
                !drop && "cursor-default"
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                  isToday
                    ? "bg-[#5f211b] text-white"
                    : "text-gray-700"
                )}
              >
                {day}
              </span>

              {/* Drop info */}
              {drop && (
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        DOT_COLORS[drop.status]
                      )}
                    />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        STATUS_COLORS[drop.status]
                      )}
                    >
                      {drop.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-700 leading-tight truncate">
                    {drop.activeCount > 0
                      ? `${drop.activeCount} items`
                      : "No items"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
