import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/auth/permissions";
import { isDropTag } from "@/lib/drops/parse-tag";
import { getDropProducts } from "@/lib/drops/get-drops";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const session = await getSession(req.headers);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    requirePermission(session, "drops:view");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tag } = await params;
  const tagStr = decodeURIComponent(tag ?? "");
  if (!isDropTag(tagStr)) {
    return NextResponse.json({ error: "Invalid drop tag" }, { status: 404 });
  }

  const { products, usingMockData } = await getDropProducts(tagStr);
  return NextResponse.json({ products, usingMockData });
}
