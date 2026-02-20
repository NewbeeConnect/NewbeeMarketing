"use client";

import { useState } from "react";
import { Palette, Upload, Plus, Trash2, Save } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function BrandPage() {
  const [brandName, setBrandName] = useState("Newbee");
  const [brandVoice, setBrandVoice] = useState("");
  const [colors, setColors] = useState({
    primary: "#FF6B00",
    secondary: "#1A1A2E",
    accent: "#00D4AA",
  });

  return (
    <>
      <AppHeader title="Brand Kit" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Brand Identity</h2>
            <p className="text-sm text-muted-foreground">
              Define your brand so AI generates content consistent with your
              identity
            </p>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Brand Name & Voice */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Basics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandVoice">
                  Brand Voice & Tone
                  <span className="text-xs text-muted-foreground ml-2">
                    (AI will use this as reference)
                  </span>
                </Label>
                <Textarea
                  id="brandVoice"
                  placeholder="Describe your brand's personality, tone of voice, and communication style. E.g., 'Friendly and approachable, targeting young expats. Avoids jargon, uses inclusive language. Tone is warm but professional.'"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-md border"
                    style={{ backgroundColor: value }}
                  />
                  <div className="flex-1 space-y-1">
                    <Label className="capitalize">{key}</Label>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setColors((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      setColors((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="h-10 w-14 p-1 cursor-pointer"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Light Logo</Label>
                  <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dark Logo</Label>
                  <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors bg-zinc-900">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto text-zinc-400" />
                      <p className="text-xs text-zinc-400 mt-1">Upload</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Watermark */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Watermark</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors">
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload watermark image
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Opacity</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="30"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Library */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Asset Library</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Upload Assets
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Upload product photos, app screenshots, and other brand assets
                to use as references in video generation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
