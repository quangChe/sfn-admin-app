import { getCalendarClient } from "./oauth-client";

export async function listCalendarEvents(
  calendarId = "primary",
  timeMin?: string,
  timeMax?: string,
  maxResults = 50
) {
  const calendar = await getCalendarClient();
  const now = new Date().toISOString();
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin ?? now,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return response.data;
}

export async function getCalendarEvent(eventId: string, calendarId = "primary") {
  const calendar = await getCalendarClient();
  const response = await calendar.events.get({ calendarId, eventId });
  return response.data;
}

export async function listCalendars() {
  const calendar = await getCalendarClient();
  const response = await calendar.calendarList.list({ minAccessRole: "reader" });
  return response.data;
}
