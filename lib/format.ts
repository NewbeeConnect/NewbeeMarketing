/**
 * Shared formatting utilities
 *
 * Used across analytics, trends, and other pages.
 */

/** Format large numbers: 1500 → "1.5K", 2000000 → "2.0M" */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format percentage: 0.0523 → "5.23%" */
export function formatPercent(n: number, decimals = 2): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/** Status label: "pending_review" → "Pending Review" */
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
