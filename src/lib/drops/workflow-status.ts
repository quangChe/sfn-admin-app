import type { WorkflowStage } from "@/types/drops";

export type WorkflowStageStatus =
  | "not_yet"
  | "window_open"
  | "in_progress"
  | "complete"
  | "blocked";

export interface Alert {
  level: "urgent" | "warn" | "info";
  message: string;
  tag: string;
  stage?: WorkflowStage;
}

export interface DropWorkflowSummary {
  tag: string;
  daysUntilDrop: number;
  stageStatuses: Partial<Record<WorkflowStage, WorkflowStageStatus>>;
}

export interface StageOpts {
  doneCount?: number;
  totalCount?: number;
}

// [windowOpen, windowClose] — days before drop when the stage window opens and closes
export const STAGE_WINDOWS: Record<WorkflowStage, [number, number]> = {
  receive:        [21, 14],
  photography:    [14,  5],
  authentication: [ 7,  4],
  copy:           [ 7,  3],
  specs:          [ 7,  3],
  pricing:        [ 3,  1],
  channels:       [ 1,  0],
};

export function deriveWorkflowStatus(
  stage: WorkflowStage,
  daysUntilDrop: number,
  opts: StageOpts = {}
): WorkflowStageStatus {
  const [windowOpen, windowClose] = STAGE_WINDOWS[stage];
  const { doneCount = 0, totalCount = 0 } = opts;
  const done = totalCount > 0 && doneCount >= totalCount;

  if (done) return "complete";
  if (daysUntilDrop > windowOpen) return "not_yet";
  if (daysUntilDrop > windowClose) {
    return doneCount > 0 ? "in_progress" : "window_open";
  }
  return "blocked";
}

const LEVEL_ORDER: Record<Alert["level"], number> = { urgent: 0, warn: 1, info: 2 };

export function computeAlerts(drops: DropWorkflowSummary[]): Alert[] {
  const alerts: Alert[] = [];

  for (const drop of drops) {
    for (const [stageKey, status] of Object.entries(drop.stageStatuses)) {
      const stage = stageKey as WorkflowStage;
      if (status === "blocked") {
        alerts.push({
          level: "urgent",
          message: `${stage} overdue for ${drop.tag}`,
          tag: drop.tag,
          stage,
        });
      } else if (status === "window_open" || status === "in_progress") {
        const [, windowClose] = STAGE_WINDOWS[stage];
        if (drop.daysUntilDrop - windowClose <= 2) {
          alerts.push({
            level: "warn",
            message: `${stage} window closing soon for ${drop.tag}`,
            tag: drop.tag,
            stage,
          });
        }
      }
    }
  }

  alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  return alerts.slice(0, 6);
}
