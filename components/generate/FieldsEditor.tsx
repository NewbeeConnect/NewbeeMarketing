"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COPY } from "@/lib/generate/copy";

/**
 * Generic editor for a structured prompt blueprint. Each field shows a label
 * + hint + small input. "AI fill" button wraps the parent's onFillAI callback.
 *
 * Generics so the same component works for image and video blueprints, each
 * with their own field shape.
 */
export function FieldsEditor<T extends Record<string, string>>({
  title,
  icon,
  fieldList,
  values,
  onChange,
  onFillAI,
  aiLoading,
  ready,
}: {
  title: string;
  icon: React.ReactNode;
  fieldList: { key: keyof T & string; label: string; hint: string }[];
  values: T;
  onChange: (key: keyof T & string, value: string) => void;
  onFillAI: () => void;
  aiLoading: boolean;
  ready: boolean;
}) {
  return (
    <Card className="p-3 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {title}
          {ready && (
            <span className="ml-1 flex items-center gap-0.5 text-xs font-normal text-green-600">
              <Check className="h-3 w-3" />
              {COPY.blueprint.ready}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onFillAI}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1.5" />
          )}
          {aiLoading ? COPY.brief.drafting : COPY.brief.draftButton}
        </Button>
      </div>
      <div className="space-y-2">
        {fieldList.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs font-medium">
              {f.label}
              <span className="text-muted-foreground font-normal ml-1.5">
                {f.hint}
              </span>
            </Label>
            <Input
              value={values[f.key] as string}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="text-xs"
              placeholder="…"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
