"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Password change panel for the Settings page.
 *
 * Flow:
 *   1. User fills current password + new password + confirmation.
 *   2. We re-verify the current password by calling signInWithPassword —
 *      this guards against session-hijack scenarios where a warm session
 *      lets a malicious page update credentials without knowing the old
 *      one. Supabase's `updateUser` alone wouldn't check.
 *   3. On match, we call `auth.updateUser({ password })` with the new value.
 *   4. Inputs clear on success.
 */
export function ChangePasswordSection() {
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
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirmation don't match.");
      return;
    }
    if (next === current) {
      toast.error("New password must differ from the current one.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes.user?.email) {
        toast.error("Not signed in. Please reload and try again.");
        return;
      }

      // Step 1 — verify the OLD password. signInWithPassword returns an
      // "Invalid login credentials" error if it doesn't match.
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: userRes.user.email,
        password: current,
      });
      if (verifyErr) {
        toast.error("Current password is incorrect.");
        return;
      }

      // Step 2 — update to the new password.
      const { error: updateErr } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateErr) {
        toast.error(updateErr.message);
        return;
      }

      toast.success("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't change password");
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
          <div className="text-[14px] font-semibold ink">Change password</div>
          <div className="text-[12px] ink-3 mt-0.5">
            Your current password is required for security. Minimum 8 characters.
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <FieldRow
          label="Current password"
          value={current}
          onChange={setCurrent}
          reveal={showCurrent}
          onToggleReveal={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />
        <FieldRow
          label="New password"
          value={next}
          onChange={setNext}
          reveal={showNext}
          onToggleReveal={() => setShowNext((v) => !v)}
          autoComplete="new-password"
        />
        <FieldRow
          label="Confirm new password"
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
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-brand-ink text-[13px] font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {saving && <Loader2 className="h-3 w-3 nb-spin" />}
            {saving ? "Updating…" : "Update password"}
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
  return (
    <div className="space-y-1">
      <label className="text-[11.5px] font-medium ink-2">{label}</label>
      <div className="relative">
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={8}
          className="w-full h-9 pr-10 px-3 rounded-md border border-line bg-panel text-[12.5px] ink mono outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute right-2 top-1/2 -translate-y-1/2 ink-3 hover:ink transition"
          aria-label={reveal ? "Hide" : "Show"}
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
