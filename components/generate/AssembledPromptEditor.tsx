"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Shows the final prompt string that will be sent to Nano Banana 2 or Veo
 * 3.1. Defaults to whatever `assembleXxxPrompt(fields)` produced from the
 * blueprint, but the user can override it — their edits win.
 *
 * "Reset from blueprint" re-runs the assembly helper (passed in) and
 * replaces the textarea content so the user can iterate on blueprint fields
 * without losing this step.
 */
export function AssembledPromptEditor({
  value,
  onChange,
  onResetFromBlueprint,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onResetFromBlueprint: () => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="assembled-prompt">
          Prompt going to the model
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetFromBlueprint}
          className="h-7 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Rebuild from blueprint
        </Button>
      </div>
      <Textarea
        id="assembled-prompt"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your edited prompt, sent as-is to the model."
      />
      <p className="text-xs text-muted-foreground">
        {hint ??
          "Edit anything above. What you see here is exactly what the model receives."}
      </p>
    </div>
  );
}
