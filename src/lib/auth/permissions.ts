import type { AppSession } from "./index";

export function hasPermission(
  session: Pick<AppSession, "user"> | null | undefined,
  key: string
): boolean {
  return session?.user.permissions?.includes(key) ?? false;
}

/** Throws if the session is missing the required permission. */
export function requirePermission(
  session: Pick<AppSession, "user"> | null | undefined,
  key: string
): void {
  if (!hasPermission(session, key)) {
    throw new Error(`Forbidden: missing permission "${key}"`);
  }
}
