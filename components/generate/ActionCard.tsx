"use client";

import { Loader2 } from "lucide-react";

/**
 * Big clickable card used in Image/Video stages. Primary cards are filled
 * with the brand color; secondary cards get a brand-soft icon block against
 * a panel background.
 */
export function ActionCard({
  icon,
  title,
  body,
  onClick,
  loading,
  primary,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  loading?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`group text-left rounded-xl border p-4 transition disabled:opacity-50 disabled:cursor-not-allowed ${
        primary
          ? "bg-brand text-brand-ink border-brand hover:brightness-95"
          : "bg-panel border-line hover:border-brand ink"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${
          primary ? "" : "bg-brand-soft text-brand-ink"
        }`}
        style={
          primary
            ? { background: "var(--nb-brand-ink)", color: "var(--nb-brand)" }
            : undefined
        }
      >
        {loading ? (
          <Loader2 className="h-[18px] w-[18px] nb-spin" />
        ) : (
          icon
        )}
      </div>
      <div className="text-[14px] font-semibold">{title}</div>
      <div
        className={`text-[12px] mt-1 leading-relaxed ${
          primary ? "text-brand-ink opacity-80" : "ink-2"
        }`}
      >
        {body}
      </div>
    </button>
  );
}
