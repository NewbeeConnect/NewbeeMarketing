"use client";

import { useState } from "react";
import type { ProjectStrategy } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Target,
  MessageCircle,
  Music,
  Clock,
  Film,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface StrategyPanelProps {
  strategy: ProjectStrategy;
  approved: boolean;
  onApprove: () => void;
  onEdit: (field: keyof ProjectStrategy, value: unknown) => void;
}

export function StrategyPanel({
  strategy,
  approved,
  onApprove,
  onEdit,
}: StrategyPanelProps) {
  return (
    <div className="space-y-4">
      <EditableField
        icon={<Zap className="h-4 w-4 text-yellow-500" />}
        label="Hook"
        sublabel="First 2-3 seconds - must grab attention"
        value={strategy.hook}
        onSave={(v) => onEdit("hook", v)}
        disabled={approved}
      />

      <EditableField
        icon={<Target className="h-4 w-4 text-blue-500" />}
        label="Narrative Arc"
        sublabel="The story flow from start to finish"
        value={strategy.narrative_arc}
        onSave={(v) => onEdit("narrative_arc", v)}
        disabled={approved}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-green-500" />
            Key Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {strategy.key_messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {i + 1}
                </Badge>
                <span className="text-sm">{msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditableField
        icon={<Target className="h-4 w-4 text-red-500" />}
        label="Call to Action"
        sublabel="What should the viewer do?"
        value={strategy.cta}
        onSave={(v) => onEdit("cta", v)}
        disabled={approved}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Duration
            </div>
            <p className="text-2xl font-bold mt-1">
              {strategy.recommended_duration}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Film className="h-4 w-4" />
              Scenes
            </div>
            <p className="text-2xl font-bold mt-1">
              {strategy.recommended_scenes}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music className="h-4 w-4" />
              Music Mood
            </div>
            <p className="text-sm font-medium mt-1">
              {strategy.music_mood}
            </p>
          </CardContent>
        </Card>
      </div>

      {!approved && (
        <Button onClick={onApprove} size="lg" className="w-full">
          <Check className="h-4 w-4 mr-2" />
          Approve Strategy & Continue to Scenes
        </Button>
      )}
    </div>
  );
}

function EditableField({
  icon,
  label,
  sublabel,
  value,
  onSave,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  value: string;
  onSave: (value: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
          {!disabled && !editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
