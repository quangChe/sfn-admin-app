"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { MapPin, Users } from "lucide-react";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus: string }>;
}

function eventDate(event: CalendarEvent): Date | null {
  const raw = event.start.dateTime ?? event.start.date;
  if (!raw) return null;
  try {
    return parseISO(raw);
  } catch {
    return null;
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/google/calendar?maxResults=50");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setEvents(json.items ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Calendar — Upcoming Events</h2>

      {events.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No upcoming events.
        </p>
      )}

      <div className="space-y-3">
        {events.map((event) => {
          const date = eventDate(event);
          const isAllDay = !event.start.dateTime;

          return (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{event.summary}</CardTitle>
                  <Badge variant={event.status === "confirmed" ? "default" : "secondary"}>
                    {event.status}
                  </Badge>
                </div>
                {date && (
                  <p className="text-sm text-muted-foreground">
                    {isAllDay
                      ? format(date, "EEEE, MMMM d, yyyy")
                      : format(date, "EEEE, MMMM d, yyyy · h:mm a")}
                  </p>
                )}
              </CardHeader>
              {(event.location || (event.attendees && event.attendees.length > 0)) && (
                <CardContent className="pt-0 space-y-1.5">
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {event.location}
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      {event.attendees
                        .slice(0, 3)
                        .map((a) => a.displayName ?? a.email)
                        .join(", ")}
                      {event.attendees.length > 3 &&
                        ` +${event.attendees.length - 3} more`}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
