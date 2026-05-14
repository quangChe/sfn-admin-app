import { auth } from "@/auth";
import { DropCalendar } from "@/components/drops/drop-calendar";
import { DropSidebar } from "@/components/drops/drop-sidebar";
import { MOCK_DROPS } from "@/lib/drops/mock-data";
import type { DropApiDrop } from "@/types/drops";

async function getDrops(): Promise<{ drops: DropApiDrop[]; usingMockData?: boolean }> {
  const session = await auth();
  if (!session) return { drops: MOCK_DROPS, usingMockData: true };

  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/shopify/drops`,
      {
        headers: { Cookie: "" },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { drops: MOCK_DROPS, usingMockData: true };
  }
}

export default async function DropsPage() {
  const { drops, usingMockData } = await getDrops();

  return (
    <div className="flex flex-col gap-4 h-full">
      {usingMockData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Using mock data — Shopify API unavailable
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
