"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Pencil, RotateCcw } from "lucide-react";
import type { Scene } from "@/types/database";

interface PromptCardProps {
  scene: Scene;
  onApprove: (sceneId: string) => void;
  onReject: (sceneId: string) => void;
  onEdit: (sceneId: string, prompt: string, negativePrompt: string) => void;
  onRegenerate: (sceneId: string) => void;
  isOptimizing?: boolean;
}

export function PromptCard({
  scene,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  isOptimizing,
}: PromptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(scene.optimized_prompt || "");
  const [editedNegative, setEditedNegative] = useState(scene.negative_prompt || "");

  const handleSaveEdit = () => {
    onEdit(scene.id, editedPrompt, editedNegative);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedPrompt(scene.optimized_prompt || "");
    setEditedNegative(scene.negative_prompt || "");
    setIsEditing(false);
  };

  return (
    <Card className={scene.prompt_approved ? "border-green-500/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Scene {scene.scene_number}
            </span>
            {scene.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{scene.duration_seconds}s</Badge>
            {scene.prompt_approved && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                Approved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diff View: Original vs Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Original Description */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Description
            </p>
            <div className="rounded-md bg-muted/50 p-3 text-sm min-h-[100px]">
              {scene.user_prompt || scene.description}
            </div>
          </div>

          {/* Optimized Prompt */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Optimized Veo Prompt
            </p>
            {isEditing ? (
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            ) : (
              <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-sm min-h-[100px]">
                {scene.optimized_prompt || (
                  <span className="text-muted-foreground italic">
                    Not yet optimized
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Negative Prompt */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Negative Prompt
          </p>
          {isEditing ? (
            <Textarea
              value={editedNegative}
              onChange={(e) => setEditedNegative(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          ) : (
            <div className="rounded-md bg-destructive/5 border border-destructive/10 p-3 text-sm">
              {scene.negative_prompt || (
                <span className="text-muted-foreground italic">
                  Not yet generated
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRegenerate(scene.id)}
                disabled={isOptimizing}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Re-optimize
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditedPrompt(scene.optimized_prompt || "");
                  setEditedNegative(scene.negative_prompt || "");
                  setIsEditing(true);
                }}
                disabled={!scene.optimized_prompt}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
              {scene.prompt_approved ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(scene.id)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Revoke
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onApprove(scene.id)}
                  disabled={!scene.optimized_prompt}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
