"use client";

import { Loader2 } from "lucide-react";

/**
 * Image/Video aşamalarında kullanılan büyük tıklanabilir kart.
 *
 * - `primary=true` → brand-dolu kart (AI ile üret gibi ana aksiyonlar)
 * - default → panel arka planlı, brand-soft icon block'lu secondary kart
 *
 * Her karta `title` attribute geçebilir (hover tooltip) — "bu butona basınca
 * ne olur" açıklamasını hem görünür alt metinde hem hover'da verebilmek için.
 */
export function ActionCard({
  icon,
  title,
  body,
  onClick,
  loading,
  primary,
  disabled,
  titleAttr,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  loading?: boolean;
  primary?: boolean;
  disabled?: boolean;
  /** Native `title=` tooltip content (shown on hover). */
  titleAttr?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      title={titleAttr}
      className={`group text-left rounded-xl border p-4 tile-interactive disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 ${
        primary
          ? "bg-brand text-brand-ink border-brand hover:brightness-[1.03] hover:saturate-[1.05]"
          : "bg-panel border-line hover:border-brand/60 ink"
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
      <div className="text-[16.5px] font-semibold">{title}</div>
      <div
        className={`text-[14px] mt-1 leading-relaxed ${
          primary ? "text-brand-ink opacity-80" : "ink-2"
        }`}
      >
        {body}
      </div>
    </button>
  );
}
