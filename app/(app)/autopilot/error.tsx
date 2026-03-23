"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AutopilotError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 p-4 lg:p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="font-medium mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {error.message || "An unexpected error occurred with Autopilot."}
          </p>
          <Button onClick={reset} variant="outline">Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
