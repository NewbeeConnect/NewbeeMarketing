"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Image as ImageIcon } from "lucide-react";

interface CreativeMetric {
  url: string;
  type: "video" | "image";
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend_usd: number;
}

interface CreativePerformanceTableProps {
  creatives: CreativeMetric[];
}

export function CreativePerformanceTable({
  creatives,
}: CreativePerformanceTableProps) {
  if (creatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Creative Performansı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz creative performans verisi yok
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by CTR descending
  const sorted = [...creatives].sort((a, b) => b.ctr - a.ctr);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Creative Performansı ({creatives.length} creative)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Creative</th>
                <th className="text-right py-2 px-2 font-medium">Gösterim</th>
                <th className="text-right py-2 px-2 font-medium">Tıklama</th>
                <th className="text-right py-2 px-2 font-medium">CTR</th>
                <th className="text-right py-2 px-2 font-medium">Dönüşüm</th>
                <th className="text-right py-2 pl-2 font-medium">Harcama</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((creative, i) => {
                const cpc =
                  creative.clicks > 0
                    ? creative.spend_usd / creative.clicks
                    : 0;
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        {creative.type === "video" ? (
                          <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate max-w-[150px] text-xs">
                          {creative.url.split("/").pop()}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {creative.type}
                        </Badge>
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {creative.impressions.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {creative.clicks.toLocaleString()}
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {(creative.ctr * 100).toFixed(2)}%
                    </td>
                    <td className="text-right py-2 px-2 tabular-nums">
                      {creative.conversions}
                    </td>
                    <td className="text-right py-2 pl-2">
                      <div className="tabular-nums">
                        ${creative.spend_usd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        CPC: ${cpc.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
