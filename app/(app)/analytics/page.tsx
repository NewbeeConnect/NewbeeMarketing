"use client";

import { BarChart3, DollarSign, Video, Image as ImageIcon, Zap } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TOTAL_CREDIT_USD } from "@/lib/constants";

export default function AnalyticsPage() {
  // TODO: Replace with actual data from useAnalytics hook
  const totalSpent = 0;
  const budgetPercentage = (totalSpent / TOTAL_CREDIT_USD) * 100;

  return (
    <>
      <AppHeader title="Analytics" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track API usage, costs, and generation performance
          </p>
        </div>

        {/* Budget Gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Google Cloud Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-bold text-lg">
                ${TOTAL_CREDIT_USD.toLocaleString()}
              </span>
            </div>
            <Progress value={budgetPercentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Spent</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  ${(TOTAL_CREDIT_USD - totalSpent).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {budgetPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gemini (AI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-muted-foreground">
                Strategy + Scripts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Veo 3.1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-muted-foreground">Video Generation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Imagen 4
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-muted-foreground">
                Image Generation
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cloud TTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-muted-foreground">Voiceovers</p>
            </CardContent>
          </Card>
        </div>

        {/* Generation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Generation Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Generation statistics will appear after your first video
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
