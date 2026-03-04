import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listGmailMessages, getGmailMessage, getMessageHeader } from "@/lib/google/gmail";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");
  const labelIds = searchParams.get("label")?.split(",") ?? ["INBOX"];
  const maxResults = Math.min(parseInt(searchParams.get("maxResults") ?? "20"), 100);
  const pageToken = searchParams.get("pageToken") ?? undefined;

  try {
    if (messageId) {
      const message = await getGmailMessage(messageId);
      const headers = message.payload?.headers ?? [];
      return NextResponse.json({
        id: message.id,
        threadId: message.threadId,
        labelIds: message.labelIds,
        snippet: message.snippet,
        internalDate: message.internalDate,
        subject: getMessageHeader(headers, "subject"),
        from: getMessageHeader(headers, "from"),
        to: getMessageHeader(headers, "to"),
        date: getMessageHeader(headers, "date"),
        payload: message.payload,
      });
    }

    const list = await listGmailMessages(labelIds, maxResults, pageToken);

    // Fetch minimal headers for each message
    const messagesWithDetails = await Promise.all(
      (list.messages ?? []).slice(0, 20).map(async (msg) => {
        const full = await getGmailMessage(msg.id!);
        const headers = full.payload?.headers ?? [];
        return {
          id: full.id,
          threadId: full.threadId,
          snippet: full.snippet,
          internalDate: full.internalDate,
          labelIds: full.labelIds,
          subject: getMessageHeader(headers, "subject"),
          from: getMessageHeader(headers, "from"),
          date: getMessageHeader(headers, "date"),
        };
      })
    );

    return NextResponse.json({
      messages: messagesWithDetails,
      nextPageToken: list.nextPageToken,
      resultSizeEstimate: list.resultSizeEstimate,
    });
  } catch (error) {
    console.error("Gmail GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Gmail messages" },
      { status: 500 }
    );
  }
}
