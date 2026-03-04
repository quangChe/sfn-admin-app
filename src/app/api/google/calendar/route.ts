import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listCalendarEvents, listCalendars } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId") ?? "primary";
  const timeMin = searchParams.get("timeMin") ?? undefined;
  const timeMax = searchParams.get("timeMax") ?? undefined;
  const maxResults = Math.min(parseInt(searchParams.get("maxResults") ?? "50"), 250);
  const listAll = searchParams.get("list") === "calendars";

  try {
    if (listAll) {
      const calendars = await listCalendars();
      return NextResponse.json(calendars);
    }

    const events = await listCalendarEvents(calendarId, timeMin, timeMax, maxResults);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
