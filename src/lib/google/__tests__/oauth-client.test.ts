import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock googleapis before importing the module under test
const mockSetCredentials = vi.fn();
const mockOAuth2Instance = { setCredentials: mockSetCredentials };

vi.mock("googleapis", () => {
  // Must use `function` keyword so it can be called with `new`
  const MockOAuth2 = vi.fn(function () {
    return mockOAuth2Instance;
  });
  return {
    google: {
      auth: { OAuth2: MockOAuth2 },
      sheets: vi.fn((opts: unknown) => ({ kind: "sheets", opts })),
      drive: vi.fn((opts: unknown) => ({ kind: "drive", opts })),
      gmail: vi.fn((opts: unknown) => ({ kind: "gmail", opts })),
      calendar: vi.fn((opts: unknown) => ({ kind: "calendar", opts })),
    },
  };
});

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

import { google } from "googleapis";
import {
  getGoogleOAuthClient,
  getSheetsClient,
  getDriveClient,
  getGmailClient,
  getCalendarClient,
} from "@/lib/google/oauth-client";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AUTH_GOOGLE_ID = "test-client-id";
  process.env.AUTH_GOOGLE_SECRET = "test-client-secret";
});

// ---------------------------------------------------------------------------
// getGoogleOAuthClient
// ---------------------------------------------------------------------------
describe("getGoogleOAuthClient", () => {
  it("returns an OAuth2 client when session has a valid access token", async () => {
    mockAuth.mockResolvedValue({
      accessToken: "access-123",
      refreshToken: "refresh-456",
      expiresAt: 1700000000,
    });

    const client = await getGoogleOAuthClient();

    expect(client).toBe(mockOAuth2Instance);
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      "test-client-id",
      "test-client-secret",
    );
    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: "access-123",
      refresh_token: "refresh-456",
      expiry_date: 1700000000 * 1000,
    });
  });

  it("sets expiry_date to undefined when expiresAt is missing", async () => {
    mockAuth.mockResolvedValue({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });

    await getGoogleOAuthClient();

    expect(mockSetCredentials).toHaveBeenCalledWith(
      expect.objectContaining({ expiry_date: undefined }),
    );
  });

  it("sets expiry_date to undefined when expiresAt is 0 (falsy)", async () => {
    mockAuth.mockResolvedValue({
      accessToken: "access-123",
      expiresAt: 0,
    });

    await getGoogleOAuthClient();

    expect(mockSetCredentials).toHaveBeenCalledWith(
      expect.objectContaining({ expiry_date: undefined }),
    );
  });

  it("throws when session is null", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(getGoogleOAuthClient()).rejects.toThrow(
      "No active session or access token",
    );
  });

  it("throws when session exists but accessToken is missing", async () => {
    mockAuth.mockResolvedValue({ refreshToken: "refresh-456" });

    await expect(getGoogleOAuthClient()).rejects.toThrow(
      "No active session or access token",
    );
  });

  it("throws when session has a RefreshTokenError", async () => {
    mockAuth.mockResolvedValue({
      accessToken: "access-123",
      error: "RefreshTokenError",
    });

    await expect(getGoogleOAuthClient()).rejects.toThrow(
      "Refresh token is invalid — user must re-authenticate",
    );
  });

  it("works when refreshToken is undefined (access-only session)", async () => {
    mockAuth.mockResolvedValue({
      accessToken: "access-123",
      expiresAt: 1700000000,
    });

    const client = await getGoogleOAuthClient();

    expect(client).toBe(mockOAuth2Instance);
    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: "access-123",
      refresh_token: undefined,
      expiry_date: 1700000000 * 1000,
    });
  });
});

// ---------------------------------------------------------------------------
// Service client factories
// ---------------------------------------------------------------------------
describe("getSheetsClient", () => {
  it("returns a Sheets client using the OAuth2 client", async () => {
    mockAuth.mockResolvedValue({ accessToken: "a" });

    const client = await getSheetsClient();

    expect(google.sheets).toHaveBeenCalledWith({
      version: "v4",
      auth: mockOAuth2Instance,
    });
    expect(client).toEqual({ kind: "sheets", opts: { version: "v4", auth: mockOAuth2Instance } });
  });

  it("propagates auth errors", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSheetsClient()).rejects.toThrow("No active session");
  });
});

describe("getDriveClient", () => {
  it("returns a Drive client using the OAuth2 client", async () => {
    mockAuth.mockResolvedValue({ accessToken: "a" });

    const client = await getDriveClient();

    expect(google.drive).toHaveBeenCalledWith({
      version: "v3",
      auth: mockOAuth2Instance,
    });
    expect(client).toEqual({ kind: "drive", opts: { version: "v3", auth: mockOAuth2Instance } });
  });

  it("propagates auth errors", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getDriveClient()).rejects.toThrow("No active session");
  });
});

describe("getGmailClient", () => {
  it("returns a Gmail client using the OAuth2 client", async () => {
    mockAuth.mockResolvedValue({ accessToken: "a" });

    const client = await getGmailClient();

    expect(google.gmail).toHaveBeenCalledWith({
      version: "v1",
      auth: mockOAuth2Instance,
    });
    expect(client).toEqual({ kind: "gmail", opts: { version: "v1", auth: mockOAuth2Instance } });
  });

  it("propagates auth errors", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getGmailClient()).rejects.toThrow("No active session");
  });
});

describe("getCalendarClient", () => {
  it("returns a Calendar client using the OAuth2 client", async () => {
    mockAuth.mockResolvedValue({ accessToken: "a" });

    const client = await getCalendarClient();

    expect(google.calendar).toHaveBeenCalledWith({
      version: "v3",
      auth: mockOAuth2Instance,
    });
    expect(client).toEqual({ kind: "calendar", opts: { version: "v3", auth: mockOAuth2Instance } });
  });

  it("propagates auth errors", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getCalendarClient()).rejects.toThrow("No active session");
  });
});
