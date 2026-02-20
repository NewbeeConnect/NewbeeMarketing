"use client";

import { useParams } from "next/navigation";
import { useProjectHistory } from "@/hooks/useProjectHistory";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: versions, isLoading } = useProjectHistory(projectId);

  if (isLoading) {
    return (
      <>
        <AppHeader title="Version History" />
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Version History" />
      <div className="p-6 space-y-4">
        {!versions || versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <History className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No version history yet.</p>
          </div>
        ) : (
          versions.map((version) => (
            <Card key={version.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">v{version.version_number}</Badge>
                  <Badge variant="secondary">{version.step}</Badge>
                  <span className="text-xs text-muted-foreground font-normal">
                    {formatDistanceToNow(new Date(version.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {version.change_description ?? "No description"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
