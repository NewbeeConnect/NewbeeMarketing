"use client";

import { useProjectHistory } from "@/hooks/useProjectHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VersionHistoryProps {
  projectId: string;
  step: "strategy" | "scenes" | "prompts";
  onRestore?: (snapshot: unknown) => void;
}

export function VersionHistory({ projectId, step, onRestore }: VersionHistoryProps) {
  const { data: versions, isLoading } = useProjectHistory(projectId, step);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
          <span className="text-xs text-muted-foreground font-normal">
            ({versions.length} version{versions.length !== 1 ? "s" : ""})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2 pr-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-2 rounded-md border text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{version.version_number}</span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {version.change_description ?? "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(version.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {index > 0 && onRestore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(version.snapshot)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restore
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
