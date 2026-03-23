/**
 * Status Colors — Single source of truth
 *
 * Shared badge color classes for ContentQueueStatus and ABTestStatus values.
 * Import from here instead of redefining in each page component.
 */

import type { ContentQueueStatus, ABTestStatus, AutopilotRunStatus } from "./types";

/** Badge colors for content queue statuses (queue, content detail pages) */
export const CONTENT_STATUS_COLORS: Record<ContentQueueStatus, string> = {
  draft: "bg-gray-500/10 text-gray-600",
  pending_review: "bg-amber-500/10 text-amber-600",
  approved: "bg-blue-500/10 text-blue-600",
  scheduled: "bg-indigo-500/10 text-indigo-600",
  publishing: "bg-cyan-500/10 text-cyan-600",
  published: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  rejected: "bg-red-500/10 text-red-600",
  revision_requested: "bg-orange-500/10 text-orange-600",
};

/** Badge colors for A/B test statuses */
export const AB_TEST_STATUS_COLORS: Record<ABTestStatus, string> = {
  draft: "bg-gray-500/10 text-gray-600",
  running: "bg-green-500/10 text-green-600",
  paused: "bg-yellow-500/10 text-yellow-600",
  completed: "bg-blue-500/10 text-blue-600",
  cancelled: "bg-red-500/10 text-red-600",
};

/** Badge colors for autopilot run statuses */
export const RUN_STATUS_COLORS: Record<AutopilotRunStatus, string> = {
  running: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
  cancelled: "bg-gray-500/10 text-gray-600",
};

/** Generic lookup for any status string. Falls back to empty string. */
export function getStatusColor(status: string): string {
  return (
    (CONTENT_STATUS_COLORS as Record<string, string>)[status] ??
    (AB_TEST_STATUS_COLORS as Record<string, string>)[status] ??
    (RUN_STATUS_COLORS as Record<string, string>)[status] ??
    ""
  );
}
