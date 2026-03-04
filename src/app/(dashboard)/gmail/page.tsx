"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";

interface GmailMessage {
  id: string;
  snippet: string;
  internalDate: string;
  subject: string;
  from: string;
  date: string;
  labelIds?: string[];
}

export default function GmailPage() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/google/gmail?maxResults=20");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setMessages(json.messages ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load Gmail");
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Gmail</h2>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Gmail — Inbox</h2>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {messages.length === 0 && (
              <p className="p-6 text-center text-muted-foreground">No messages.</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="px-4 py-3 hover:bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{msg.from}</p>
                    <p className="text-sm truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {msg.snippet}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {msg.internalDate && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(parseInt(msg.internalDate)), "MMM d")}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1 justify-end flex-wrap">
                      {msg.labelIds
                        ?.filter((l) => !["INBOX", "UNREAD", "CATEGORY_PERSONAL"].includes(l))
                        .slice(0, 2)
                        .map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
