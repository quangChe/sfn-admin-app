import type { DropStatus, DropTag, DropType } from "@/types/drops";

export function isDropTag(tag: string): boolean {
  return /^[1-9]\d?\.[1-9]\d?\.\d{2}(-[a-z]+)?$/.test(tag);
}

export function parseDropTag(tag: string): DropTag | null {
  const match = tag.match(/^([1-9]\d?)\.([1-9]\d?)\.(\d{2})(?:-([a-z]+))?$/);
  if (!match) return null;
  const [, m, d, y, typeStr] = match;
  const date = new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d));
  const typeMap: Record<string, DropType> = {
    bags: "bags",
    watches: "watches",
    jewelry: "jewelry",
  };
  const type: DropType =
    typeStr && typeMap[typeStr] ? typeMap[typeStr] : "mixed";
  return { raw: tag, date, type };
}

export function formatDropTag(date: Date, type?: DropType): string {
  const base = `${date.getMonth() + 1}.${date.getDate()}.${String(date.getFullYear()).slice(-2)}`;
  return type && type !== "mixed" ? `${base}-${type}` : base;
}

export function getDropStatus(tagDate: Date, now = new Date()): DropStatus {
  const msSinceStart = now.getTime() - tagDate.getTime();
  const dayMs = 86_400_000;
  if (msSinceStart < -14 * dayMs) return "future";
  if (msSinceStart < -2 * dayMs) return "draft";
  if (msSinceStart < 0) return "upcoming";
  if (msSinceStart < 1 * dayMs) return "live";
  return "ended";
}

export function dropTagToDate(tagStr: string): Date | null {
  const parsed = parseDropTag(tagStr);
  return parsed?.date ?? null;
}

export function formatDropLabel(tagStr: string): string {
  const parsed = parseDropTag(tagStr);
  if (!parsed) return tagStr;
  const { date, type } = parsed;
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const suffix =
    day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
  const typeLabel =
    type === "mixed" ? "" : ` — ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  return `${month} ${day}${suffix}${typeLabel}`;
}
