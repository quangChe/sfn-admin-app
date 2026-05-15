import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/permissions";
import { getDropsForCalendar } from "@/lib/drops/get-drops";

export async function GET(req: Request) {
  const session = await getSession(req.headers);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    requirePermission(session, "drops:view");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { drops, usingMockData } = await getDropsForCalendar();
  return NextResponse.json({ drops, usingMockData });
}
