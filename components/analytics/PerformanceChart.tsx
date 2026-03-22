"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend_usd: number;
  conversions: number;
  video_views_25?: number;
  video_views_50?: number;
  video_views_75?: number;
  video_views_100?: number;
}

interface PerformanceChartProps {
  data: DailyMetric[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    month: "short",
    day: "numeric",
  });
}

export function ImpressionsClicksChart({ data }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Gösterim & Tıklama
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis yAxisId="left" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" fontSize={11} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              stroke="hsl(var(--primary))"
              name="Gösterim"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="clicks"
              stroke="hsl(var(--chart-2, 142 71% 45%))"
              name="Tıklama"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CtrTrendChart({ data }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    ctr: +(d.ctr * 100).toFixed(2),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">CTR Trendi (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} unit="%" />
            <Tooltip formatter={(value) => [`${value}%`, "CTR"]} />
            <Line
              type="monotone"
              dataKey="ctr"
              stroke="hsl(var(--chart-3, 47 96% 53%))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SpendChart({ data }: PerformanceChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    spend: d.spend_usd,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Günlük Harcama ($)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis fontSize={11} unit="$" />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Harcama"]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive) / 0.1)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function VideoCompletionChart({ data }: PerformanceChartProps) {
  const hasVideoData = data.some((d) => d.video_views_25 || d.video_views_100);

  if (!hasVideoData) return null;

  // Aggregate video completion rates
  const totals = data.reduce(
    (acc, d) => ({
      v25: acc.v25 + (d.video_views_25 || 0),
      v50: acc.v50 + (d.video_views_50 || 0),
      v75: acc.v75 + (d.video_views_75 || 0),
      v100: acc.v100 + (d.video_views_100 || 0),
    }),
    { v25: 0, v50: 0, v75: 0, v100: 0 }
  );

  const chartData = [
    { label: "%25", views: totals.v25 },
    { label: "%50", views: totals.v50 },
    { label: "%75", views: totals.v75 },
    { label: "%100", views: totals.v100 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Video İzlenme Oranları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar
              dataKey="views"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="İzleme"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
