"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { COPY } from "@/lib/i18n/copy";
import { WhatIsThis } from "@/components/ui/WhatIsThis";

/**
 * Ayarlar sayfasındaki şifre değiştirme paneli.
 *
 * Akış:
 *   1. Kullanıcı mevcut + yeni + yeni (tekrar) alanlarını doldurur.
 *   2. Mevcut şifreyi `signInWithPassword` ile re-verify ederiz — Supabase'in
 *      `updateUser` fonksiyonu tek başına eski şifreyi kontrol etmediği için,
 *      aksi hâlde çalıntı bir session yeni şifre set edebilir.
 *   3. Doğrulama geçerse `auth.updateUser({ password })` ile güncelleriz.
 *   4. Başarılı olunca input'lar temizlenir.
 */
export function ChangePasswordSection() {
  const s = COPY.settings.password;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (next.length < 8) {
      toast.error(s.errors.minLength);
      return;
    }
    if (next !== confirm) {
      toast.error(s.errors.mismatch);
      return;
    }
    if (next === current) {
      toast.error(s.errors.sameAsOld);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes.user?.email) {
        toast.error(s.errors.notSignedIn);
        return;
      }

      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: userRes.user.email,
        password: current,
      });
      if (verifyErr) {
        toast.error(s.errors.wrongCurrent);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        toast.error(updateErr.message);
        return;
      }

      toast.success(s.success);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : s.errors.generic);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-5 mb-4">
      <div className="flex items-start gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-soft text-brand-ink">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[16.5px] font-semibold ink">{s.title}</div>
          <div className="text-[14px] ink-3 mt-0.5">{s.sub}</div>
        </div>
      </div>

      <div className="mb-4">
        <WhatIsThis
          title={s.whatIsThis.title}
          body={s.whatIsThis.body}
          bullets={s.whatIsThis.bullets}
        />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <FieldRow
          label={s.fields.current}
          value={current}
          onChange={setCurrent}
          reveal={showCurrent}
          onToggleReveal={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />
        <FieldRow
          label={s.fields.next}
          value={next}
          onChange={setNext}
          reveal={showNext}
          onToggleReveal={() => setShowNext((v) => !v)}
          autoComplete="new-password"
        />
        <FieldRow
          label={s.fields.confirm}
          value={confirm}
          onChange={setConfirm}
          reveal={showNext}
          onToggleReveal={() => setShowNext((v) => !v)}
          autoComplete="new-password"
        />
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || !current || !next || !confirm}
            title="Mevcut şifreni doğrulayıp yenisini kaydeder"
            className="btn btn-md btn-primary"
          >
            {saving && <Loader2 className="h-3 w-3 nb-spin" />}
            {saving ? s.submitting : s.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  reveal,
  onToggleReveal,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  reveal: boolean;
  onToggleReveal: () => void;
  autoComplete: string;
}) {
  const s = COPY.settings.password;
  return (
    <div className="space-y-1">
      <label className="text-[13.5px] font-medium ink-2">{label}</label>
      <div className="relative">
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={8}
          className="w-full h-9 pr-10 px-3 rounded-md border border-line bg-panel text-[14.5px] ink mono outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute right-2 top-1/2 -translate-y-1/2 ink-3 hover:ink transition"
          aria-label={reveal ? s.hideLabel : s.revealLabel}
          title={reveal ? s.hideLabel : s.revealLabel}
          tabIndex={-1}
        >
          {reveal ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
