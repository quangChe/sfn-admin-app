"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceProvider, useWorkspace } from "@/components/drops/workspace-context";
import { parseDropTag, getDropStatus } from "@/lib/drops/parse-tag";

const TABS = [
  { id: "pricing", label: "Pricing", emoji: "💰", path: "pricing" },
  { id: "copy", label: "Copy", emoji: "✍️", path: "copy" },
  { id: "specs", label: "Specs", emoji: "📋", path: "specs" },
  { id: "media", label: "Media", emoji: "📸", path: "media" },
  { id: "channels", label: "Channels", emoji: "📡", path: "channels" },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-[#5f211b] text-white" },
  upcoming: { label: "Upcoming", className: "bg-amber-100 text-amber-800" },
  draft: { label: "Draft", className: "bg-[#f2ede9] text-[#8a7a72]" },
  future: { label: "Future", className: "bg-blue-50 text-blue-700" },
  ended: { label: "Ended", className: "bg-gray-100 text-gray-500" },
};

function WorkspaceSaveBar() {
  const { dirtyCount, dirtyLabel, triggerSave, triggerDiscard, isSaving } =
    useWorkspace();

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex items-center justify-between border-t border-[#e5ddd8] bg-white/95 backdrop-blur-sm px-6 py-3 transition-opacity",
        dirtyCount === 0 && "opacity-50 pointer-events-none"
      )}
    >
      <span className="text-sm text-[#8a7a72]">
        {dirtyCount > 0 ? (
          <>
            <strong className="text-gray-800 font-semibold">
              {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
            </strong>
            {dirtyLabel && (
              <span> in {dirtyLabel} view</span>
            )}
          </>
        ) : (
          "No unsaved changes"
        )}
      </span>
      <div className="flex gap-2">
        <button
          onClick={triggerDiscard}
          disabled={isSaving || dirtyCount === 0}
          className="rounded-md border border-[#e5ddd8] bg-white px-4 py-1.5 text-sm font-medium text-[#8a7a72] hover:bg-[#f2ede9] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          Discard
        </button>
        <button
          onClick={triggerSave}
          disabled={isSaving || dirtyCount === 0}
          className="rounded-md bg-[#5f211b] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#4a1a15] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}

function WorkspaceInner({
  tagStr,
  children,
}: {
  tagStr: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const parsed = parseDropTag(tagStr);
  const status = parsed ? getDropStatus(parsed.date) : "draft";
  const badge = STATUS_BADGE[status];

  const date = parsed?.date;
  const dateLabel = date
    ? date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : tagStr;

  const daysUntil = date
    ? Math.ceil((date.getTime() - new Date().getTime()) / 86_400_000)
    : null;

  const activeTab = TABS.find((t) =>
    pathname.endsWith(`/${t.path}`)
  );

  return (
    <div className="flex flex-col min-h-full -m-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        <Link
          href="/drops"
          className="flex items-center gap-1 text-sm text-[#8a7a72] hover:text-[#5f211b] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Drop Calendar
        </Link>
        <span className="text-[#e5ddd8]">/</span>
        <span className="text-sm font-medium text-gray-700">{tagStr}</span>
      </div>

      {/* Drop header */}
      <div className="flex items-start justify-between gap-4 px-6 pb-4 border-b border-[#e5ddd8]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="text-2xl font-semibold text-gray-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {dateLabel}
            </h1>
            <span className="font-mono text-sm text-[#8a7a72] bg-[#f2ede9] rounded px-2 py-0.5">
              {tagStr}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#8a7a72]">
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {daysUntil !== null && daysUntil > 0
                ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""} away`
                : daysUntil === 0
                ? "Today"
                : "Past"}
            </span>
          </div>
        </div>

        <button className="shrink-0 rounded-md bg-[#5f211b] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a1a15] transition-colors">
          Publish Drop
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-[#e5ddd8] bg-[#faf8f5]">
        {TABS.map((tab) => {
          const isActive = activeTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(`/drops/${tagStr}/${tab.path}`)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#5f211b] text-white shadow-sm"
                  : "text-[#8a7a72] hover:bg-[#f2ede9] hover:text-gray-700"
              )}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>

      {/* Save bar */}
      <WorkspaceSaveBar />
    </div>
  );
}

export default function DropWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tag: string }>;
}) {
  const { tag } = use(params);
  const tagStr = decodeURIComponent(tag);

  return (
    <WorkspaceProvider tagStr={tagStr}>
      <WorkspaceInner tagStr={tagStr}>{children}</WorkspaceInner>
    </WorkspaceProvider>
  );
}
