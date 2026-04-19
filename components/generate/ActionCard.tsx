"use client";

import { Loader2 } from "lucide-react";

/**
 * A big clickable card that invokes one action — e.g. "Generate with AI" or
 * "Upload my own". Primary = filled/colored, secondary = outlined.
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
      className={`flex flex-col items-start gap-1.5 rounded-md border-2 p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        primary
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 font-medium text-sm">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{body}</p>
    </button>
  );
}
