/**
 * Audit log schema.
 * APPEND-ONLY — never update or delete rows from change_log.
 * Every state change in the application must write a row here via emitEvent().
 */
import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./users";

export const changeLog = pgTable(
  "change_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    changedBy: text("changed_by")
      .notNull()
      .references(() => user.id),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    source: text("source").notNull(),
    metadata: jsonb("metadata"),
  },
  (t) => [
    index("change_log_entity_idx").on(t.entityType, t.entityId, t.changedAt),
    index("change_log_user_idx").on(t.changedBy, t.changedAt),
  ]
);
