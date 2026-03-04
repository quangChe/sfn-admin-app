import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listDriveFiles, searchDriveFiles } from "@/lib/google/drive";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;
  const pageToken = searchParams.get("pageToken") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "50"), 100);

  try {
    const data = search
      ? await searchDriveFiles(search, pageSize)
      : await listDriveFiles(folderId, pageToken, pageSize);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Drive GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Drive files" },
      { status: 500 }
    );
  }
}
