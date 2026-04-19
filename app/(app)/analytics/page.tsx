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
import { COPY } from "@/lib/i18n/copy";
import { WhatIsThis } from "@/components/ui/WhatIsThis";

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
    // useAnalytics emits `month` as the first 7 chars of an ISO timestamp
    // ("YYYY-MM"). We parse that into a localized 3-letter abbreviation
    // ("Apr") for the axis, falling back to a raw slice if the value ever
    // deviates from the expected format.
    const months = data?.monthlySpend ?? [];
    const tail = months.slice(-12);
    while (tail.length < 12) tail.unshift({ month: "", amount: 0 });
    return tail.map((t) => {
      let label = "—";
      if (t.month) {
        // Append "-01" so Date treats the string as a valid calendar date
        const iso = /^\d{4}-\d{2}$/.test(t.month) ? `${t.month}-01` : t.month;
        const d = new Date(iso);
        if (!Number.isNaN(d.getTime())) {
          label = d.toLocaleDateString(undefined, { month: "short" });
        } else {
          label = t.month.slice(-2);
        }
      }
      return { ...t, label };
    });
  }, [data?.monthlySpend]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.amount));

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="serif text-[34px] ink">
            {COPY.analytics.pageTitle}
          </div>
          <div className="text-[14.5px] ink-3 mt-0.5">
            {COPY.analytics.pageSub}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <WhatIsThis
          title={COPY.analytics.whatIsThis.title}
          body={COPY.analytics.whatIsThis.body}
          bullets={COPY.analytics.whatIsThis.bullets}
          note={COPY.analytics.whatIsThis.note}
        />
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
                <div className="text-[14px] ink-3 uppercase tracking-wide">
                  {COPY.analytics.budget.label}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="serif text-[40px] ink">
                    ${totalSpent.toFixed(2)}
                  </div>
                  <div className="text-[15px] ink-3">
                    {COPY.analytics.budget.of(
                      `$${TOTAL_CREDIT_USD.toFixed(2)}`
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[14px] ink-3">
                  {COPY.analytics.budget.remaining}
                </div>
                <div className="text-[22px] font-semibold ink mono">
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
            <div className="flex items-center justify-between mt-2 text-[13px] ink-3">
              <span>
                %{pct.toFixed(0)} {COPY.analytics.budget.used}
              </span>
              {pct >= 80 && (
                <span style={{ color: "var(--nb-danger)" }}>
                  {COPY.analytics.budget.cap}
                </span>
              )}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard
              label={COPY.analytics.statCards.images}
              value={String(stats.imageCount)}
              sub={COPY.analytics.statCards.imagesSub(stats.completed)}
              Icon={ImageIcon}
            />
            <StatCard
              label={COPY.analytics.statCards.videos}
              value={String(stats.videoCount)}
              sub={COPY.analytics.statCards.videosSub(stats.failed)}
              Icon={VideoIcon}
            />
            <StatCard
              label={COPY.analytics.statCards.total}
              value={String(stats.total)}
              sub={COPY.analytics.statCards.totalSub}
              Icon={Sparkles}
            />
            <StatCard
              label={COPY.analytics.statCards.success}
              value={`%${successRate}`}
              sub={COPY.analytics.statCards.successSub(
                stats.completed,
                stats.total
              )}
              Icon={CheckCircle2}
            />
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-line bg-panel p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[16.5px] font-semibold ink">
                  {COPY.analytics.trend.title}
                </div>
                <div className="text-[13.5px] ink-3">
                  {COPY.analytics.trend.sub}
                </div>
              </div>
            </div>
            <div className="h-[180px] flex items-end gap-1.5">
              {trend.map((t, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={COPY.analytics.trend.monthTooltip(
                    t.month || COPY.analytics.trend.monthEmpty,
                    `$${t.amount.toFixed(2)}`
                  )}
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
            <div className="flex justify-between mt-2 text-[11.5px] ink-3 mono">
              {trend.map((t, i) => (
                <span key={i}>{t.label}</span>
              ))}
            </div>
          </div>

          {/* Breakdown by service */}
          <div className="rounded-xl border border-line bg-panel overflow-hidden">
            <div className="px-5 py-3 border-b border-line-2 flex items-center justify-between">
              <div className="text-[16.5px] font-semibold ink whitespace-nowrap">
                {COPY.analytics.breakdown.title}
              </div>
              <button className="text-[13.5px] ink-3 hover:text-brand-ink flex items-center gap-1 transition">
                <Download className="h-3 w-3" /> {COPY.analytics.breakdown.exportCsv}
              </button>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2 px-5 py-2.5 border-b border-line-2 text-[13px] ink-3 uppercase tracking-wide">
              <span>{COPY.analytics.breakdown.colService}</span>
              <span className="text-right">
                {COPY.analytics.breakdown.colSpend}
              </span>
            </div>
            {(
              [
                {
                  key: "gemini",
                  label: COPY.analytics.breakdown.services.gemini,
                },
                {
                  key: "imagen",
                  label: COPY.analytics.breakdown.services.imagen,
                },
                { key: "veo", label: COPY.analytics.breakdown.services.veo },
                { key: "tts", label: COPY.analytics.breakdown.services.tts },
              ] as const
            ).map((row) => {
              const cost =
                (data?.costByService as Record<string, number> | undefined)?.[
                  row.key
                ] ?? 0;
              return (
                <div
                  key={row.key}
                  className="grid grid-cols-[1fr_120px] gap-2 px-5 py-3 border-b border-line-2 last:border-b-0 text-[15px] items-center"
                >
                  <span className="ink font-medium">{row.label}</span>
                  <span className="text-right ink font-medium mono">
                    ${cost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[13px] ink-3">
            Projeler: {PROJECTS.map((p) => p.name).join(" · ")}
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
        <div className="text-[13.5px] ink-3 uppercase tracking-wide">
          {label}
        </div>
        <Icon className="h-3.5 w-3.5 ink-3" />
      </div>
      <div className="serif text-[34px] ink mt-2">{value}</div>
      <div className="text-[13.5px] ink-3 mt-0.5">{sub}</div>
    </div>
  );
}
