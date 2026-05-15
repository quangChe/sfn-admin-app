import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./users";

export const workflowSignoffs = pgTable(
  "workflow_signoffs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dropTag: text("drop_tag").notNull(),
    stage: text("stage").notNull(),
    signedOffBy: text("signed_off_by")
      .notNull()
      .references(() => user.id),
    signedOffAt: timestamp("signed_off_at").notNull().defaultNow(),
    note: text("note"),
  },
  (t) => [unique().on(t.dropTag, t.stage)]
);

export const dismissedAlerts = pgTable(
  "dismissed_alerts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    alertKey: text("alert_key").notNull(),
    dismissedAt: timestamp("dismissed_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.alertKey] })]
);

export const presence = pgTable(
  "presence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (t) => [index("presence_entity_idx").on(t.entityType, t.entityId, t.lastSeenAt)]
);
