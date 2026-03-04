import { getGmailClient } from "./oauth-client";

export async function listGmailMessages(
  labelIds: string[] = ["INBOX"],
  maxResults = 20,
  pageToken?: string
) {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.list({
    userId: "me",
    labelIds,
    maxResults,
    pageToken,
  });
  return response.data;
}

export async function getGmailMessage(messageId: string) {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  return response.data;
}

export async function listGmailLabels() {
  const gmail = await getGmailClient();
  const response = await gmail.users.labels.list({ userId: "me" });
  return response.data;
}

export function getMessageHeader(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string
): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}
