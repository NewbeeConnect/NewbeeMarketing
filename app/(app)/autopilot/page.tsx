"use client";

import { useState } from "react";
import { useAutopilotConfig, useUpdateAutopilotConfig, useAutopilotRuns, useTriggerAutopilot } from "@/hooks/useAutopilot";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, Play, History, DollarSign, Zap, Clock, Save,
  CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { RUN_STATUS_COLORS } from "@/lib/social/status-colors";

function ConfigForm({ config }: { config: { frequency: string; monthly_budget_usd: number; auto_generate: boolean; is_enabled: boolean; id?: string } }) {
  const updateConfig = useUpdateAutopilotConfig();
  const [frequency, setFrequency] = useState<string>(config.frequency);
  const [budget, setBudget] = useState(String(config.monthly_budget_usd));
  const [autoGen, setAutoGen] = useState(config.auto_generate);

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateConfig.mutateAsync({ is_enabled: enabled });
      toast.success(enabled ? "Autopilot enabled" : "Autopilot disabled");
    } catch { toast.error("Failed to update"); }
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig.mutateAsync({
        frequency: frequency as "daily" | "weekly" | "biweekly",
        monthly_budget_usd: parseFloat(budget) || 100,
        auto_generate: autoGen,
      });
      toast.success("Configuration saved");
    } catch { toast.error("Failed to save"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-5 w-5" /> Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Autopilot</Label>
            <p className="text-sm text-muted-foreground">Run daily to generate content suggestions</p>
          </div>
          <Switch
            checked={config.is_enabled}
            onCheckedChange={handleToggle}
            disabled={updateConfig.isPending}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3 pt-2">
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5"><Clock className="h-3.5 w-3.5" /> Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5"><DollarSign className="h-3.5 w-3.5" /> Monthly Budget ($)</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min={0} max={10000} />
          </div>
          <div className="flex items-end">
            <div className="flex-1">
              <Label className="flex items-center gap-1.5 mb-1.5"><Zap className="h-3.5 w-3.5" /> Auto-generate content</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch checked={autoGen} onCheckedChange={setAutoGen} />
                <span className="text-sm text-muted-foreground">{autoGen ? "On" : "Off"}</span>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={handleSaveConfig} disabled={updateConfig.isPending} variant="outline" size="sm">
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AutopilotPage() {
  const { data: config, isLoading: configLoading } = useAutopilotConfig();
  const { data: runs, isLoading: runsLoading } = useAutopilotRuns();
  const trigger = useTriggerAutopilot();

  const handleTrigger = async () => {
    try {
      await trigger.mutateAsync();
      toast.success("Autopilot run triggered");
    } catch { toast.error("Failed to trigger"); }
  };

  return (
    <>
      <AppHeader title="Autopilot" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">AI Autopilot</h2>
            <p className="text-sm text-muted-foreground">
              AI agent that analyzes performance, detects trends, and generates content automatically
            </p>
          </div>
          <Button onClick={handleTrigger} disabled={trigger.isPending}>
            <Play className="h-4 w-4 mr-2" />
            Run Now
          </Button>
        </div>

        {/* Config */}
        {configLoading ? (
          <Skeleton className="h-48" />
        ) : config ? (
          <ConfigForm key={config.id ?? "default"} config={config} />
        ) : null}

        {/* Run History */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" /> Run History
          </h3>
          {runsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : runs && runs.length > 0 ? (
            <div className="space-y-3">
              {runs.map((run) => (
                <Card key={run.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    {run.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : run.status === "failed" ? (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    ) : run.status === "running" ? (
                      <Bot className="h-5 w-5 text-blue-500 animate-pulse shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={RUN_STATUS_COLORS[run.status] ?? ""}>{run.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{run.content_generated} generated</span>
                        <span>{run.content_published} published</span>
                        {run.ai_cost_usd > 0 && <span>${run.ai_cost_usd.toFixed(3)} cost</span>}
                      </div>
                    </div>
                    {run.error_message && (
                      <p className="text-xs text-red-500 max-w-xs truncate">{run.error_message}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No autopilot runs yet. Enable and run to start.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
