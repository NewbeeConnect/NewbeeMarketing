"use client";

import Link from "next/link";
import { useAbTests } from "@/hooks/useAbTests";
import { formatStatus } from "@/lib/format";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FlaskConical, Trophy, Clock, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AB_TEST_STATUS_COLORS } from "@/lib/social/status-colors";

export default function ABTestsPage() {
  const { data: tests, isLoading } = useAbTests();

  return (
    <>
      <AppHeader title="A/B Tests" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">A/B Testing</h2>
            <p className="text-sm text-muted-foreground">
              Test content variants and let AI optimize for the best performer
            </p>
          </div>
          <Button asChild>
            <Link href="/social/ab-tests/new">
              <Plus className="h-4 w-4 mr-2" /> New Test
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : tests && tests.length > 0 ? (
          <div className="space-y-3">
            {tests.map((test) => (
              <Link key={test.id} href={`/social/ab-tests/${test.id}`}>
                <Card className="hover:border-primary/50 transition-colors mb-3">
                  <CardContent className="flex items-center gap-4 py-4">
                    <FlaskConical className="h-5 w-5 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{test.name}</p>
                        <Badge className={AB_TEST_STATUS_COLORS[test.status as keyof typeof AB_TEST_STATUS_COLORS] ?? ""}>{test.status}</Badge>
                      </div>
                      {test.hypothesis && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{test.hypothesis}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{test.variant_count} variants</span>
                        <span>{formatStatus(test.success_metric)}</span>
                        {test.winner_variant && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Trophy className="h-3 w-3" /> Winner: {test.winner_variant}
                          </span>
                        )}
                        <span className="ml-auto">
                          {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">No A/B tests yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create an A/B test to compare content variants and find what resonates
              </p>
              <Button asChild>
                <Link href="/social/ab-tests/new">
                  <Plus className="h-4 w-4 mr-1" /> Create Test
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
