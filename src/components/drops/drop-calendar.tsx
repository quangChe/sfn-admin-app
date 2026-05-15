"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DropApiDrop } from "@/types/drops";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Month nav */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5ddd8] bg-white text-[#8a7a72] hover:bg-[#5f211b] hover:text-white hover:border-[#5f211b] transition-all"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[15px] font-semibold text-[#1a1108]">
          {monthName} {year}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5ddd8] bg-white text-[#8a7a72] hover:bg-[#5f211b] hover:text-white hover:border-[#5f211b] transition-all"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[10.5px] font-semibold uppercase tracking-[.06em] text-[#8a7a72]">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-md border border-transparent bg-transparent"
              />
            );
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
                "aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all",
                drop
                  ? "bg-[#f5eeec] border-[#d8b8b4] cursor-pointer hover:bg-[#edd8d5] hover:border-[#5f211b]"
                  : "bg-white border-transparent hover:border-[#5f211b] cursor-default"
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "flex items-center justify-center text-[12px] font-medium leading-none",
                  isToday
                    ? "bg-[#5f211b] text-white rounded-full w-[22px] h-[22px]"
                    : "text-[#1a1108]"
                )}
              >
                {day}
              </span>

              {drop && (
                <>
                  <span className="mt-1 block h-[5px] w-[5px] rounded-full bg-[#5f211b]" />
                  <span className="mt-0.5 text-[9px] font-semibold text-[#5f211b] leading-none">
                    {drop.activeCount > 0 ? `${drop.activeCount}` : "0"}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[11px] text-[#8a7a72]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-[#d8b8b4] bg-[#f5eeec]" />
          Has drop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-[#5f211b]" />
          Today
        </span>
      </div>
    </div>
  );
}
