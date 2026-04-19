"use client";

import { Lightbulb } from "lucide-react";

/**
 * Bal-rengi "Bu adımda / bölümde / sayfada ne yapıyoruz?" kartı.
 *
 * Tasarım:
 *   - Sol kenarda ince `border-brand` strip (4px) — kartı diğer cardlardan
 *     görsel olarak ayırır.
 *   - Açık `bg-brand-soft` arka plan + `ink` metin (light mode'da kahverengi
 *     altın, dark mode'da bej-kahve)
 *   - Ampul ikonu + başlık + body + opsiyonel bullet listesi + opsiyonel not
 *
 * Kullanım: TimelineStep'in `help` prop'uyla veya sayfa section'ının üstünde
 * direkt olarak render edilir. Her zaman açık — kullanıcı kapatamaz.
 * Bullet içeriğinde **kalın** kısımlar desteklenir (basit markdown dönüşümü).
 */
export function WhatIsThis({
  title,
  body,
  bullets,
  note,
  className = "",
}: {
  title: string;
  body?: string;
  bullets?: readonly string[];
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-l-4 bg-brand-soft text-brand-ink ${className}`}
      style={{ borderLeftColor: "var(--nb-brand)" }}
    >
      <div className="p-3 sm:p-3.5">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[14.5px] font-semibold leading-snug">
              {title}
            </div>
            {body && (
              <div className="text-[14px] opacity-90 mt-1 leading-relaxed">
                {body}
              </div>
            )}
            {bullets && bullets.length > 0 && (
              <ul className="mt-2 space-y-1 text-[14px] leading-relaxed">
                {bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="opacity-60 shrink-0">•</span>
                    <span
                      className="flex-1 opacity-90"
                      // Simple `**kalın**` parse — no external md lib for one feature.
                      dangerouslySetInnerHTML={{ __html: renderBold(b) }}
                    />
                  </li>
                ))}
              </ul>
            )}
            {note && (
              <div className="text-[13.5px] opacity-75 mt-2 italic">{note}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal `**bold**` → `<strong>bold</strong>` dönüşümü. HTML escape yapmıyor
 * çünkü içerik tamamen statik COPY.ts'den geliyor — user-generated değil.
 * Herhangi bir user-input gelirse önce escape edip sonra replace yap.
 */
function renderBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
