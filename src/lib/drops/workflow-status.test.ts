import { describe, it, expect } from "vitest";
import {
  deriveWorkflowStatus,
  computeAlerts,
  STAGE_WINDOWS,
  type DropWorkflowSummary,
} from "./workflow-status";

describe("deriveWorkflowStatus — photography stage", () => {
  const [windowOpen, windowClose] = STAGE_WINDOWS.photography; // [14, 5]

  it("returns not_yet when before window opens", () => {
    expect(deriveWorkflowStatus("photography", windowOpen + 1)).toBe("not_yet");
  });

  it("returns window_open when in window with nothing started", () => {
    const mid = Math.floor((windowOpen + windowClose) / 2); // 9
    expect(
      deriveWorkflowStatus("photography", mid, { doneCount: 0, totalCount: 10 })
    ).toBe("window_open");
  });

  it("returns in_progress when in window with partial work done", () => {
    const mid = Math.floor((windowOpen + windowClose) / 2); // 9
    expect(
      deriveWorkflowStatus("photography", mid, { doneCount: 5, totalCount: 10 })
    ).toBe("in_progress");
  });

  it("returns complete when all products are done", () => {
    const mid = Math.floor((windowOpen + windowClose) / 2); // 9
    expect(
      deriveWorkflowStatus("photography", mid, { doneCount: 10, totalCount: 10 })
    ).toBe("complete");
  });

  it("returns blocked when window has closed without completion", () => {
    expect(
      deriveWorkflowStatus("photography", windowClose - 1, {
        doneCount: 3,
        totalCount: 10,
      })
    ).toBe("blocked");
  });
});

describe("deriveWorkflowStatus — edge cases", () => {
  it("returns complete even when before window opens, if all done", () => {
    expect(
      deriveWorkflowStatus("pricing", 30, { doneCount: 5, totalCount: 5 })
    ).toBe("complete");
  });

  it("treats zero totalCount as not done", () => {
    // Inside the pricing window [3,1], daysUntilDrop=2
    expect(
      deriveWorkflowStatus("pricing", 2, { doneCount: 0, totalCount: 0 })
    ).toBe("window_open");
  });
});

describe("computeAlerts", () => {
  it("generates an urgent alert for a blocked stage", () => {
    const drops: DropWorkflowSummary[] = [
      {
        tag: "5.15.26",
        daysUntilDrop: 0,
        stageStatuses: { pricing: "blocked" },
      },
    ];
    const alerts = computeAlerts(drops);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("urgent");
    expect(alerts[0].tag).toBe("5.15.26");
    expect(alerts[0].stage).toBe("pricing");
  });

  it("does not generate a warn when window close is more than 2 days away", () => {
    const drops: DropWorkflowSummary[] = [
      {
        tag: "5.22.26",
        daysUntilDrop: 7, // copy windowClose=3, 7-3=4 > 2 → no warn
        stageStatuses: { copy: "window_open" },
      },
    ];
    const alerts = computeAlerts(drops);
    expect(alerts.filter((a) => a.level === "warn")).toHaveLength(0);
  });

  it("generates a warn alert when window close is within 2 days", () => {
    const drops: DropWorkflowSummary[] = [
      {
        tag: "5.22.26",
        daysUntilDrop: 4, // copy windowClose=3, 4-3=1 ≤ 2 → warn
        stageStatuses: { copy: "window_open" },
      },
    ];
    const alerts = computeAlerts(drops);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("warn");
    expect(alerts[0].stage).toBe("copy");
  });

  it("sorts urgent before warn", () => {
    const drops: DropWorkflowSummary[] = [
      {
        tag: "5.15.26",
        daysUntilDrop: 1,
        stageStatuses: {
          // channels windowClose=0: 1-0=1 ≤ 2 → warn
          channels: "window_open",
          // pricing → blocked → urgent
          pricing: "blocked",
        },
      },
    ];
    const alerts = computeAlerts(drops);
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(alerts[0].level).toBe("urgent");
    const warnIndex = alerts.findIndex((a) => a.level === "warn");
    const urgentIndex = alerts.findIndex((a) => a.level === "urgent");
    expect(urgentIndex).toBeLessThan(warnIndex);
  });

  it("caps the result at 6 alerts", () => {
    const drops: DropWorkflowSummary[] = Array.from({ length: 10 }, (_, i) => ({
      tag: `5.${i + 1}.26`,
      daysUntilDrop: 0,
      stageStatuses: {
        pricing: "blocked" as const,
        channels: "blocked" as const,
      },
    }));
    const alerts = computeAlerts(drops);
    expect(alerts).toHaveLength(6);
  });

  it("returns empty array when there are no issues", () => {
    const drops: DropWorkflowSummary[] = [
      {
        tag: "5.1.26",
        daysUntilDrop: 30,
        stageStatuses: { pricing: "not_yet", photography: "not_yet" },
      },
    ];
    expect(computeAlerts(drops)).toHaveLength(0);
  });
});
