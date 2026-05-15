import { db } from "@/lib/db";
import { changeLog } from "@/lib/db/schema/audit";

export type EventName =
  | "drop.created"
  | "drop.product.priced"
  | "drop.product.copy_edited"
  | "drop.product.specs_edited"
  | "drop.workflow.signed_off"
  | "drop.published";

export interface EmitEventPayload {
  entityType: string;
  entityId: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  userId: string;
  /** e.g. 'pricing_tab', 'specs_tab', 'status_board' */
  source: string;
  metadata?: Record<string, unknown>;
}

/**
 * Single chokepoint for state-change observability. Every save route
 * MUST call this — even if no subscribers exist yet.
 *
 * Currently writes one append-only row to `change_log`. Future expansion
 * (Inngest publish, Slack notifications, websocket broadcast) hooks in
 * here, not at individual call sites.
 */
export async function emitEvent(
  name: EventName,
  payload: EmitEventPayload
): Promise<void> {
  await db.insert(changeLog).values({
    eventType: name,
    entityType: payload.entityType,
    entityId: payload.entityId,
    field: payload.field ?? null,
    oldValue: payload.oldValue ?? null,
    newValue: payload.newValue ?? null,
    changedBy: payload.userId,
    source: payload.source,
    metadata: payload.metadata ?? null,
  });
}
