"use client";

import { CalendarDays } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <>
      <AppHeader title="Content Calendar" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Content Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Plan and schedule your content across platforms
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">Calendar coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Schedule and visualize your content publishing plan
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
