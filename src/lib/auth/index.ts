import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema/users";
import {
  userRoles,
  rolePermissions,
  permissions as permissionsTable,
} from "@/lib/db/schema/rbac";
import { eq } from "drizzle-orm";

// Use process.env directly so module initialization does not trigger env.ts
// validation at build time — validation fires on the first inbound request.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.AUTH_SECRET ?? "",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          if (!userData.email?.endsWith("@fashionica.com")) {
            throw new Error("Only @fashionica.com email addresses can sign in.");
          }
          return { data: userData };
        },
      },
    },
  },
});

export interface AppSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    permissions: string[];
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

/**
 * Returns the current session enriched with permissions from the RBAC tables.
 * Permissions are loaded fresh on every call — role changes take effect immediately.
 */
export async function getSession(
  requestHeaders: Headers
): Promise<AppSession | null> {
  const raw = await auth.api.getSession({ headers: requestHeaders });
  if (!raw) return null;

  const permResults = await db
    .select({ key: permissionsTable.key })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(
      permissionsTable,
      eq(rolePermissions.permissionId, permissionsTable.id)
    )
    .where(eq(userRoles.userId, raw.user.id));

  return {
    session: {
      id: raw.session.id,
      expiresAt: raw.session.expiresAt,
      token: raw.session.token,
    },
    user: {
      id: raw.user.id,
      name: raw.user.name,
      email: raw.user.email,
      image: raw.user.image,
      permissions: permResults.map((r) => r.key),
    },
  };
}
