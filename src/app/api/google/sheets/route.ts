import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSheetValues, updateSheetValues } from "@/lib/google/sheets";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const spreadsheetId = searchParams.get("spreadsheetId");
  const range = searchParams.get("range") ?? "Sheet1";

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "spreadsheetId is required" },
      { status: 400 }
    );
  }

  try {
    const data = await getSheetValues(spreadsheetId, range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Sheets GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const spreadsheetId = searchParams.get("spreadsheetId");
  const range = searchParams.get("range") ?? "Sheet1";

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "spreadsheetId is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { values } = body as { values: string[][] };
    const data = await updateSheetValues(spreadsheetId, range, values);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Sheets PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update sheet data" },
      { status: 500 }
    );
  }
}
