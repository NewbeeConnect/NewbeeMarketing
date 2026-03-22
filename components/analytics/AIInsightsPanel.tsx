"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Loader2, TrendingUp, Target, DollarSign, Lightbulb } from "lucide-react";
import { useLatestAnalysis, useRequestAnalysis } from "@/hooks/usePerformanceAnalysis";
import type { PerformanceAnalysis } from "@/app/api/ai/analyze-performance/route";

interface AIInsightsPanelProps {
  campaignId: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-50 text-green-700 border-green-300"
      : score >= 40
        ? "bg-yellow-50 text-yellow-700 border-yellow-300"
        : "bg-red-50 text-red-700 border-red-300";

  return (
    <Badge variant="outline" className={`text-lg font-bold px-3 py-1 ${color}`}>
      {score}/100
    </Badge>
  );
}

function InsightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function AIInsightsPanel({ campaignId }: AIInsightsPanelProps) {
  const { data: latestAnalysis, isLoading } = useLatestAnalysis(campaignId);
  const requestAnalysis = useRequestAnalysis();

  const analysis = latestAnalysis?.analysis as PerformanceAnalysis | undefined;

  const handleRefresh = () => {
    requestAnalysis.mutate({ campaign_id: campaignId });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Performans Analizi
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={requestAnalysis.isPending}
          >
            {requestAnalysis.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {analysis ? "Yenile" : "Analiz Et"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requestAnalysis.isPending ? (
          <div className="text-center py-8 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              AI kampanyanızı analiz ediyor...
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Score + Summary */}
            <div className="flex items-start gap-3">
              <ScoreBadge score={analysis.overall_score} />
              <p className="text-sm text-muted-foreground flex-1">
                {analysis.summary}
              </p>
            </div>

            {/* Recommendations Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <InsightCard icon={TrendingUp} title="Creative Analizi">
                <p>
                  <strong>En iyi:</strong>{" "}
                  {analysis.creative_analysis.video_vs_image.winner === "tie"
                    ? "Video ve görsel eşit"
                    : `${analysis.creative_analysis.video_vs_image.winner === "video" ? "Video" : "Görsel"} daha iyi`}
                </p>
                <p className="text-xs mt-1">
                  {analysis.creative_analysis.video_vs_image.explanation}
                </p>
              </InsightCard>

              <InsightCard icon={Target} title="Hedefleme">
                <p>
                  Yaş:{" "}
                  {analysis.targeting_recommendations.age_adjustment.recommended[0]}-
                  {analysis.targeting_recommendations.age_adjustment.recommended[1]}
                </p>
                {analysis.targeting_recommendations.interest_additions.length > 0 && (
                  <p className="text-xs mt-1">
                    Ekle: {analysis.targeting_recommendations.interest_additions.join(", ")}
                  </p>
                )}
              </InsightCard>

              <InsightCard icon={DollarSign} title="Bütçe">
                <p>
                  Önerilen günlük: $
                  {analysis.budget_recommendations.daily_budget_suggestion}
                </p>
                <p className="text-xs mt-1">
                  {analysis.budget_recommendations.projected_improvement}
                </p>
              </InsightCard>

              <InsightCard icon={Lightbulb} title="Prompt Önerileri">
                {analysis.prompt_suggestions.new_prompts.slice(0, 2).map((p, i) => (
                  <p key={i} className="text-xs mt-1">
                    {i + 1}. {p.rationale}
                  </p>
                ))}
              </InsightCard>
            </div>

            {/* A/B Test */}
            {analysis.ab_test_interpretation && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-1">A/B Test Sonucu</p>
                <p className="text-sm text-muted-foreground">
                  Kazanan:{" "}
                  <Badge variant="outline" className="ml-1">
                    {analysis.ab_test_interpretation.winner === "inconclusive"
                      ? "Kararsız"
                      : analysis.ab_test_interpretation.winner === "emotional"
                        ? "Duygusal"
                        : "Teknik"}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analysis.ab_test_interpretation.confidence}
                </p>
              </div>
            )}

            {latestAnalysis?.created_at && (
              <p className="text-[10px] text-muted-foreground text-right">
                Son analiz:{" "}
                {new Date(latestAnalysis.created_at).toLocaleString("tr-TR")}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Kampanya performansınızı AI ile analiz edin
            </p>
            <p className="text-xs text-muted-foreground">
              Hedefleme, bütçe ve creative optimizasyon önerileri alın
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
