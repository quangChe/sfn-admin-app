import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getDropsForCalendar } from "@/lib/drops/get-drops";
import { DropCalendar } from "@/components/drops/drop-calendar";
import { DropSidebar } from "@/components/drops/drop-sidebar";

export default async function DropsPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");

  if (!hasPermission(session, "drops:view")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Access Denied</p>
        <p className="mt-1 text-sm text-[#8a7a72]">
          You need the <code className="font-mono">drops:view</code> permission to see this page.
        </p>
      </div>
    );
  }

  const { drops, usingMockData } = await getDropsForCalendar();

  return (
    <div className="flex flex-col gap-4 h-full">
      {usingMockData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Using mock data — set SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local to see live drops.
        </div>
      )}

      <div>
        <h1
          className="text-3xl font-semibold text-gray-900 mb-1"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Drop Calendar
        </h1>
        <p className="text-sm text-[#8a7a72]">
          Manage and schedule FashioNica product drops
        </p>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        <DropCalendar drops={drops} />
        <DropSidebar drops={drops} />
      </div>
    </div>
  );
}
