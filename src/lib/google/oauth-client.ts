import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { auth } from "@/auth";

export async function getGoogleOAuthClient(): Promise<OAuth2Client> {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("No active session or access token");
  }

  if (session.error === "RefreshTokenError") {
    throw new Error("Refresh token is invalid — user must re-authenticate");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date: session.expiresAt ? session.expiresAt * 1000 : undefined,
  });

  return oauth2Client;
}

export async function getSheetsClient() {
  const auth = await getGoogleOAuthClient();
  return google.sheets({ version: "v4", auth });
}

export async function getDriveClient() {
  const auth = await getGoogleOAuthClient();
  return google.drive({ version: "v3", auth });
}

export async function getGmailClient() {
  const auth = await getGoogleOAuthClient();
  return google.gmail({ version: "v1", auth });
}

export async function getCalendarClient() {
  const auth = await getGoogleOAuthClient();
  return google.calendar({ version: "v3", auth });
}
