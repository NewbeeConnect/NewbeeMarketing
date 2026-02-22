"use client";

import { useState, useEffect, useRef } from "react";
import { Palette, Upload, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrandKit, useUpsertBrandKit } from "@/hooks/useBrandKit";
import { createClient } from "@/lib/supabase/client";

type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export default function BrandPage() {
  const { data: brandKit, isLoading } = useBrandKit();
  const upsertBrandKit = useUpsertBrandKit();

  const [brandName, setBrandName] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [colors, setColors] = useState({
    primary: "#FF6B00",
    secondary: "#1A1A2E",
    accent: "#00D4AA",
  });
  const [logoLightUrl, setLogoLightUrl] = useState<string | null>(null);
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null);
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);
  const watermarkRef = useRef<HTMLInputElement>(null);

  // Populate form with existing brand kit data
  useEffect(() => {
    if (brandKit) {
      setBrandName(brandKit.name);
      setBrandVoice(brandKit.brand_voice ?? "");
      if (brandKit.colors) {
        setColors({
          primary: brandKit.colors.primary ?? "#FF6B00",
          secondary: brandKit.colors.secondary ?? "#1A1A2E",
          accent: brandKit.colors.accent ?? "#00D4AA",
        });
      }
      setLogoLightUrl(brandKit.logo_light_url);
      setLogoDarkUrl(brandKit.logo_dark_url);
      setWatermarkUrl(brandKit.watermark_url);
      setWatermarkPosition((brandKit.watermark_position as WatermarkPosition) ?? "bottom-right");
      setWatermarkOpacity(brandKit.watermark_opacity ? brandKit.watermark_opacity * 100 : 30);
    }
  }, [brandKit]);

  const handleUpload = async (file: File, field: "logo_light" | "logo_dark" | "watermark") => {
    setUploadingField(field);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "png";
      const fileName = `brand/${user.id}/${field}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("mkt-assets")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("mkt-assets")
        .getPublicUrl(fileName);

      const url = publicUrl.publicUrl;

      if (field === "logo_light") setLogoLightUrl(url);
      else if (field === "logo_dark") setLogoDarkUrl(url);
      else setWatermarkUrl(url);

      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!brandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    try {
      await upsertBrandKit.mutateAsync({
        id: brandKit?.id,
        data: {
          name: brandName.trim(),
          brand_voice: brandVoice.trim() || null,
          colors: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent },
          logo_light_url: logoLightUrl,
          logo_dark_url: logoDarkUrl,
          watermark_url: watermarkUrl,
          watermark_position: watermarkPosition,
          watermark_opacity: watermarkOpacity / 100,
        },
      });
      toast.success("Brand Kit saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Brand Kit");
    }
  };

  if (isLoading) {
    return (
      <>
        <AppHeader title="Brand Kit" />
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Brand Kit" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Brand Identity</h2>
            <p className="text-sm text-muted-foreground">
              Define your brand so AI generates content consistent with your identity
            </p>
          </div>
          <Button onClick={handleSave} disabled={upsertBrandKit.isPending}>
            {upsertBrandKit.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
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
                  placeholder="Enter your brand name"
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
                  placeholder="Describe your brand's personality, tone of voice, and communication style..."
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
                    className="h-10 w-10 rounded-md border shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <div className="flex-1 space-y-1">
                    <Label className="capitalize">{key}</Label>
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setColors((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    />
                  </div>
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      setColors((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="h-10 w-14 p-1 cursor-pointer shrink-0"
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
                  <input
                    ref={logoLightRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "logo_light");
                    }}
                  />
                  <div
                    className="relative flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    onClick={() => logoLightRef.current?.click()}
                  >
                    {uploadingField === "logo_light" ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : logoLightUrl ? (
                      <>
                        <Image src={logoLightUrl} alt="Light logo" fill className="object-contain p-2" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); setLogoLightUrl(null); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-1">Upload</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dark Logo</Label>
                  <input
                    ref={logoDarkRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "logo_dark");
                    }}
                  />
                  <div
                    className="relative flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors bg-zinc-900 overflow-hidden"
                    onClick={() => logoDarkRef.current?.click()}
                  >
                    {uploadingField === "logo_dark" ? (
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    ) : logoDarkUrl ? (
                      <>
                        <Image src={logoDarkUrl} alt="Dark logo" fill className="object-contain p-2" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); setLogoDarkUrl(null); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-zinc-400" />
                        <p className="text-xs text-zinc-400 mt-1">Upload</p>
                      </div>
                    )}
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
              <input
                ref={watermarkRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "watermark");
                }}
              />
              <div
                className="relative flex items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => watermarkRef.current?.click()}
              >
                {uploadingField === "watermark" ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : watermarkUrl ? (
                  <>
                    <Image src={watermarkUrl} alt="Watermark" fill className="object-contain p-2" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); setWatermarkUrl(null); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">Upload watermark image</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={watermarkPosition}
                    onValueChange={(v) => setWatermarkPosition(v as WatermarkPosition)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Opacity ({watermarkOpacity}%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
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
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Upload product photos, app screenshots, and other brand assets
                to use as references in video generation
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Assets are automatically saved when you upload logos and watermarks above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
