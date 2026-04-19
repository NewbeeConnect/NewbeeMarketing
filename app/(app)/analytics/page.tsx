"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Video as VideoIcon,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TOTAL_CREDIT_USD } from "@/lib/constants";
import { PROJECTS } from "@/lib/projects";

/**
 * Hub-designed analytics page. Budget gauge at the top, four stat cards
 * below, then a monthly trend chart (images + videos stacked), and a
 * breakdown-by-project table. Real data comes from useAnalytics — no more
 * shadcn Skeleton/Progress wrappers.
 */
export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  const totalSpent = data?.totalSpent ?? 0;
  const remaining = Math.max(0, TOTAL_CREDIT_USD - totalSpent);
  const pct = Math.min(100, (totalSpent / TOTAL_CREDIT_USD) * 100);

  const stats = data?.generationStats ?? {
    total: 0,
    completed: 0,
    failed: 0,
    videoCount: 0,
    imageCount: 0,
  };
  const successRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const trend = useMemo(() => {
    // Take last 12 monthly buckets; fall back to zeros if unavailable.
    const months = data?.monthlySpend ?? [];
    const tail = months.slice(-12);
    while (tail.length < 12) tail.unshift({ month: "", amount: 0 });
    return tail;
  }, [data?.monthlySpend]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.amount));

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="serif text-[26px] ink">Analytics</div>
          <div className="text-[12.5px] ink-3 mt-0.5">
            Spend and activity across your projects.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 ink-3">
          <Loader2 className="h-5 w-5 nb-spin" />
        </div>
      ) : (
        <>
          {/* Budget gauge */}
          <div className="rounded-xl border border-line bg-panel p-5 mb-4">
            <div className="flex items-start justify-between mb-3 gap-4 flex-wrap">
              <div>
                <div className="text-[12px] ink-3 uppercase tracking-wide">
                  Credit used
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="serif text-[32px] ink">
                    ${totalSpent.toFixed(2)}
                  </div>
                  <div className="text-[13px] ink-3">
                    of ${TOTAL_CREDIT_USD.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] ink-3">Remaining</div>
                <div className="text-[18px] font-semibold ink mono">
                  ${remaining.toFixed(2)}
                </div>
              </div>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "var(--nb-line-2)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${pct}%`,
                  background:
                    pct > 90
                      ? "var(--nb-danger)"
                      : "var(--nb-brand)",
                  transition: "width .4s ease",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] ink-3">
              <span>{pct.toFixed(0)}% used</span>
              {pct >= 80 && (
                <span style={{ color: "var(--nb-danger)" }}>
                  Approaching budget cap
                </span>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              label="Images"
              value={String(stats.imageCount)}
              sub={`${stats.completed} successful total`}
              Icon={ImageIcon}
            />
            <StatCard
              label="Videos"
              value={String(stats.videoCount)}
              sub={`${stats.failed} failed total`}
              Icon={VideoIcon}
            />
            <StatCard
              label="Total generations"
              value={String(stats.total)}
              sub="Across all projects"
              Icon={Sparkles}
            />
            <StatCard
              label="Success rate"
              value={`${successRate}%`}
              sub={`${stats.completed} of ${stats.total || "—"}`}
              Icon={CheckCircle2}
            />
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-line bg-panel p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[14px] font-semibold ink">
                  Spend over time
                </div>
                <div className="text-[11.5px] ink-3">Last 12 months</div>
              </div>
            </div>
            <div className="h-[180px] flex items-end gap-1.5">
              {trend.map((t, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={`${t.month || "—"}: $${t.amount.toFixed(2)}`}
                >
                  <div
                    className="w-full rounded"
                    style={{
                      height: `${(t.amount / maxTrend) * 170}px`,
                      background: "var(--nb-brand)",
                      minHeight: t.amount > 0 ? 2 : 0,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] ink-3 mono">
              {trend.map((t, i) => (
                <span key={i}>
                  {t.month ? t.month.slice(5, 7) : "—"}
                </span>
              ))}
            </div>
          </div>

          {/* Breakdown by service */}
          <div className="rounded-xl border border-line bg-panel overflow-hidden">
            <div className="px-5 py-3 border-b border-line-2 flex items-center justify-between">
              <div className="text-[14px] font-semibold ink whitespace-nowrap">
                Breakdown by service
              </div>
              <button className="text-[11.5px] ink-3 hover:text-brand-ink flex items-center gap-1 transition">
                <Download className="h-3 w-3" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2 px-5 py-2.5 border-b border-line-2 text-[11px] ink-3 uppercase tracking-wide">
              <span>Service</span>
              <span className="text-right">Spend</span>
            </div>
            {(
              [
                { key: "gemini", label: "Gemini (brief + prompt)" },
                { key: "imagen", label: "Nano Banana 2 (image)" },
                { key: "veo", label: "Veo 3.1 (video)" },
                { key: "tts", label: "TTS" },
              ] as const
            ).map((row) => {
              const cost =
                (data?.costByService as Record<string, number> | undefined)?.[
                  row.key
                ] ?? 0;
              return (
                <div
                  key={row.key}
                  className="grid grid-cols-[1fr_120px] gap-2 px-5 py-3 border-b border-line-2 last:border-b-0 text-[13px] items-center"
                >
                  <span className="ink font-medium">{row.label}</span>
                  <span className="text-right ink font-medium mono">
                    ${cost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] ink-3">
            Projects: {PROJECTS.map((p) => p.name).join(" · ")}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11.5px] ink-3 uppercase tracking-wide">
          {label}
        </div>
        <Icon className="h-3.5 w-3.5 ink-3" />
      </div>
      <div className="serif text-[28px] ink mt-2">{value}</div>
      <div className="text-[11.5px] ink-3 mt-0.5">{sub}</div>
    </div>
  );
}
