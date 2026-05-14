import Link from "next/link";
import { cn } from "@/lib/utils";
import { MOCK_DROPS } from "@/lib/drops/mock-data";
import {
  deriveWorkflowStatus,
  computeAlerts,
  type DropWorkflowSummary,
  type WorkflowStageStatus,
} from "@/lib/drops/workflow-status";
import type { WorkflowStage, DropStatus } from "@/types/drops";

// Map drop status to approximate days-until-drop for alert computation.
// Using static values makes the board deterministic regardless of today's date.
const STATUS_TO_DAYS: Record<DropStatus, number> = {
  live:     0,
  upcoming: 1,
  draft:    7,
  future:   20,
  ended:    -1,
};

const STAGES: { id: WorkflowStage; label: string }[] = [
  { id: "receive",        label: "Receive"   },
  { id: "photography",    label: "Photo"     },
  { id: "authentication", label: "Auth"      },
  { id: "copy",           label: "Copy"      },
  { id: "specs",          label: "Specs"     },
  { id: "pricing",        label: "Pricing"   },
  { id: "channels",       label: "Channels"  },
];

const WORKFLOW_TAB_STAGES = new Set<WorkflowStage>([
  "copy", "specs", "pricing", "channels",
]);

const STATUS_CELL_CLASS: Record<WorkflowStageStatus, string> = {
  not_yet:     "bg-[#f2ede9] text-[#8a7a72]",
  window_open: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-blue-50 text-blue-700",
  complete:    "bg-[#3d7a5a]/10 text-[#3d7a5a]",
  blocked:     "bg-red-50 text-red-700 font-semibold",
};

export default function BoardPage() {
  // Build workflow summaries. In production this would fetch live Shopify data;
  // for now we derive everything from the mock drop list.
  const summaries: DropWorkflowSummary[] = MOCK_DROPS.map((drop) => {
    const daysUntilDrop = STATUS_TO_DAYS[drop.status] ?? 20;
    const completionFraction = drop.completionPct / 100;

    const stageStatuses: Partial<Record<WorkflowStage, WorkflowStageStatus>> =
      Object.fromEntries(
        STAGES.map(({ id: stage }, stageIndex) => {
          const stageProgressThreshold = (stageIndex + 1) / STAGES.length;
          const done = completionFraction >= stageProgressThreshold;
          return [
            stage,
            deriveWorkflowStatus(stage, daysUntilDrop, {
              doneCount: done ? 1 : 0,
              totalCount: 1,
            }),
          ];
        })
      );

    return { tag: drop.tag, daysUntilDrop, stageStatuses };
  });

  const alerts = computeAlerts(summaries);

  return (
    <div className="p-6 space-y-6">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        Drop Status Board
      </h1>

      {/* Alert strip */}
      <div data-testid="alert-strip" className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-[#8a7a72]">All drops on track — no alerts.</p>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={i}
              data-level={alert.level}
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                alert.level === "urgent" &&
                  "border-red-200 bg-red-50 text-red-700",
                alert.level === "warn" &&
                  "border-yellow-200 bg-yellow-50 text-yellow-700",
                alert.level === "info" &&
                  "border-blue-200 bg-blue-50 text-blue-700"
              )}
            >
              {alert.message}
            </div>
          ))
        )}
      </div>

      {/* Board table */}
      <div className="overflow-x-auto rounded-xl border border-[#e5ddd8]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#e5ddd8] bg-[#faf8f5]">
              <th className="py-2 px-4 text-left text-[#8a7a72] font-semibold text-xs uppercase tracking-wider">
                Drop
              </th>
              {STAGES.map(({ id, label }) => (
                <th
                  key={id}
                  className="py-2 px-3 text-center text-[#8a7a72] font-semibold text-xs uppercase tracking-wider"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr
                key={summary.tag}
                data-tag={summary.tag}
                className="border-b border-[#e5ddd8] last:border-0 hover:bg-[#faf8f5] transition-colors"
              >
                <td className="py-2.5 px-4 font-medium text-gray-800">
                  <Link
                    href={`/drops/${summary.tag}`}
                    className="hover:text-[#5f211b] transition-colors"
                  >
                    {summary.tag}
                  </Link>
                </td>
                {STAGES.map(({ id: stage, label }) => {
                  const status = summary.stageStatuses[stage] ?? "not_yet";
                  const cell = (
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-1.5 py-0.5 text-xs",
                        STATUS_CELL_CLASS[status]
                      )}
                    >
                      {status.replace("_", " ")}
                    </span>
                  );
                  return (
                    <td key={stage} className="py-2.5 px-3 text-center">
                      {WORKFLOW_TAB_STAGES.has(stage) ? (
                        <Link
                          href={`/drops/${summary.tag}/${stage}`}
                          aria-label={label}
                          className="hover:opacity-80 transition-opacity"
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
