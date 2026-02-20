"use client";

import { PromptCard } from "./PromptCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCheck } from "lucide-react";
import type { Scene } from "@/types/database";

interface PromptListProps {
  scenes: Scene[];
  onApprove: (sceneId: string) => void;
  onReject: (sceneId: string) => void;
  onEdit: (sceneId: string, prompt: string, negativePrompt: string) => void;
  onRegenerate: (sceneId: string) => void;
  onApproveAll: () => void;
  isOptimizing?: boolean;
}

export function PromptList({
  scenes,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onApproveAll,
  isOptimizing,
}: PromptListProps) {
  const approvedCount = scenes.filter((s) => s.prompt_approved).length;
  const optimizedCount = scenes.filter((s) => s.optimized_prompt).length;
  const allOptimized = optimizedCount === scenes.length;
  const allApproved = approvedCount === scenes.length;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            {optimizedCount}/{scenes.length} Optimized
          </Badge>
          <Badge
            variant="outline"
            className={
              allApproved
                ? "bg-green-500/10 text-green-600 border-green-500/30"
                : ""
            }
          >
            {approvedCount}/{scenes.length} Approved
          </Badge>
        </div>
        {allOptimized && !allApproved && (
          <Button size="sm" onClick={onApproveAll}>
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Approve All
          </Button>
        )}
      </div>

      {/* Scene Prompt Cards */}
      <div className="space-y-4">
        {scenes.map((scene) => (
          <PromptCard
            key={scene.id}
            scene={scene}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            isOptimizing={isOptimizing}
          />
        ))}
      </div>
    </div>
  );
}
