/**
 * Seed script — inserts default roles and permissions.
 * Run with: npm run db:seed
 * Requires DATABASE_URL (and other env vars validated by env.ts) in your environment.
 */
import { db } from "./index";
import { roles, permissions, rolePermissions } from "./schema";
const ROLES = [
  { name: "admin", description: "Full access" },
  { name: "pricing", description: "Pricing workflow" },
  { name: "copy", description: "Copy and specs workflow" },
  { name: "photo", description: "Photography review" },
  { name: "ops", description: "Operations and publishing" },
  { name: "viewer", description: "Read-only access" },
] as const;

const PERMISSIONS = [
  { key: "drops:view", description: "View drop calendar and workspace" },
  { key: "drops:create", description: "Create new drops" },
  { key: "drops:edit", description: "Edit drop metadata" },
  { key: "drops:publish", description: "Publish drops to channels" },
  { key: "drops:signoff:photography", description: "Sign off photography stage" },
  { key: "drops:signoff:authentication", description: "Sign off authentication stage" },
  { key: "drops:signoff:copy", description: "Sign off copy stage" },
  { key: "drops:signoff:specs", description: "Sign off specs stage" },
  { key: "drops:signoff:pricing", description: "Sign off pricing stage" },
  { key: "drops:signoff:channels", description: "Sign off channel sync stage" },
  { key: "pricing:edit", description: "Edit pricing fields" },
  { key: "copy:edit", description: "Edit copy fields" },
  { key: "specs:edit", description: "Edit specs fields" },
  { key: "audit:view", description: "View audit log" },
  { key: "users:manage", description: "Manage users and roles" },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.key),
  pricing: ["drops:view", "pricing:edit", "drops:signoff:pricing"],
  copy: ["drops:view", "copy:edit", "specs:edit", "drops:signoff:copy", "drops:signoff:specs"],
  photo: ["drops:view", "drops:signoff:photography"],
  ops: [
    "drops:view",
    "drops:create",
    "drops:edit",
    "drops:publish",
    "drops:signoff:channels",
    "drops:signoff:authentication",
  ],
  viewer: ["drops:view"],
};

async function seed() {
  console.log("Seeding roles...");
  for (const role of ROLES) {
    await db
      .insert(roles)
      .values({ name: role.name, description: role.description })
      .onConflictDoNothing();
  }

  console.log("Seeding permissions...");
  for (const perm of PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ key: perm.key, description: perm.description })
      .onConflictDoNothing();
  }

  console.log("Seeding role-permission mappings...");
  const [allRoles, allPerms] = await Promise.all([
    db.select().from(roles),
    db.select().from(permissions),
  ]);

  const roleMap = Object.fromEntries(allRoles.map((r) => [r.name, r.id]));
  const permMap = Object.fromEntries(allPerms.map((p) => [p.key, p.id]));

  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    for (const permKey of permKeys) {
      const permissionId = permMap[permKey];
      if (!permissionId) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    }
  }

  const [roleCount, permCount] = await Promise.all([
    db.select().from(roles),
    db.select().from(permissions),
  ]);
  console.log(`Done. ${roleCount.length} roles, ${permCount.length} permissions.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
