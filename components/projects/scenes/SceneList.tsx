"use client";

import { useCallback } from "react";
import type { Scene } from "@/types/database";
import { SceneCard } from "./SceneCard";
import { DurationBar } from "./DurationBar";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface SceneListProps {
  scenes: Scene[];
  targetDuration: number;
  onUpdateScene: (sceneId: string, data: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorder: (sceneIds: string[]) => void;
}

export function SceneList({
  scenes,
  targetDuration,
  onUpdateScene,
  onDeleteScene,
  onReorder,
}: SceneListProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration_seconds, 0);

  const moveScene = useCallback(
    (index: number, direction: "up" | "down") => {
      const newScenes = [...scenes];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newScenes.length) return;

      [newScenes[index], newScenes[targetIndex]] = [
        newScenes[targetIndex],
        newScenes[index],
      ];

      onReorder(newScenes.map((s) => s.id));
    },
    [scenes, onReorder]
  );

  const handleDuplicate = useCallback(
    () => {
      // TODO: Implement scene duplication via useCreateScene hook
      toast.info("Scene duplication will be available soon.");
    },
    []
  );

  return (
    <div className="space-y-3">
      <DurationBar totalSeconds={totalDuration} targetSeconds={targetDuration} />

      <div className="space-y-2">
        {scenes.map((scene, index) => (
          <div key={scene.id} className="flex gap-1 items-start">
            <div className="flex flex-col gap-0.5 pt-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0}
                onClick={() => moveScene(index, "up")}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === scenes.length - 1}
                onClick={() => moveScene(index, "down")}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex-1">
              <SceneCard
                scene={scene}
                onUpdate={(data) => onUpdateScene(scene.id, data)}
                onDelete={() => onDeleteScene(scene.id)}
                onDuplicate={handleDuplicate}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
