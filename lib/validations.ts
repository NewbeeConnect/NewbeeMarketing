import { z } from "zod";

export const brandKitSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  logo_light_url: z.string().url().nullable().optional(),
  logo_dark_url: z.string().url().nullable().optional(),
  colors: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .nullable()
    .optional(),
  fonts: z
    .object({
      heading: z.string().min(1),
      body: z.string().min(1),
      caption: z.string().optional(),
    })
    .nullable()
    .optional(),
  brand_voice: z.string().max(2000).nullable().optional(),
  watermark_url: z.string().url().nullable().optional(),
  watermark_position: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"])
    .nullable()
    .optional(),
  watermark_opacity: z.number().min(0).max(1).nullable().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  description: z.string().max(1000).nullable().optional(),
  objective: z.string().max(500).nullable().optional(),
  brand_kit_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budget_limit_usd: z.number().min(0).nullable().optional(),
  status: z
    .enum(["draft", "active", "paused", "completed", "archived"])
    .optional(),
});

export const projectBriefSchema = z.object({
  title: z.string().min(1, "Project title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  product_name: z.string().min(1, "Product name is required").max(200),
  product_description: z.string().max(2000).nullable().optional(),
  target_platforms: z
    .array(z.string())
    .min(1, "Select at least one platform"),
  target_audience: z.string().max(1000).nullable().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  style: z.string().min(1, "Select a style"),
  tone: z.string().min(1, "Select a tone"),
  additional_notes: z.string().max(2000).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  brand_kit_id: z.string().uuid().nullable().optional(),
});

export const adDeploymentSchema = z.object({
  platform: z.enum(["google", "meta"]),
  campaign_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid(),
  creative_urls: z.array(z.string().url()).min(1, "At least one creative is required"),
  budget_daily_usd: z.number().min(1).max(10000),
  budget_total_usd: z.number().min(1).max(1000000),
  targeting: z.object({
    age_range: z.tuple([z.number().min(13), z.number().max(65)]),
    locations: z.array(z.string()).min(1),
    interests: z.array(z.string()),
    languages: z.array(z.string()).min(1),
  }),
});

export const apiKeysSchema = z.object({
  platform: z.enum(["google_ads", "meta_ads"]),
  keys: z.record(z.string(), z.string()),
});

export const sceneSchema = z.object({
  title: z.string().min(1, "Scene title is required").max(200),
  description: z.string().min(1, "Scene description is required").max(2000),
  duration_seconds: z.number().min(4).max(8),
  aspect_ratio: z.enum(["9:16", "16:9", "1:1"]).optional(),
  resolution: z.enum(["720p", "1080p", "4k"]).optional(),
  camera_movement: z.string().max(200).nullable().optional(),
  lighting: z.string().max(200).nullable().optional(),
  text_overlay: z.string().max(500).nullable().optional(),
  audio_type: z
    .enum(["native_veo", "tts_voiceover", "silent"])
    .optional(),
  voiceover_text: z.string().max(1000).nullable().optional(),
  voiceover_language: z.string().nullable().optional(),
  voiceover_voice: z.string().nullable().optional(),
});

export const templateSchema = z.object({
  title: z.string().min(1, "Template name is required").max(200),
  description: z.string().max(1000).nullable().optional(),
  category: z
    .enum([
      "app_demo",
      "feature_showcase",
      "testimonial",
      "event_promo",
      "brand_awareness",
      "general",
    ])
    .optional(),
  platform: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  tone: z.string().nullable().optional(),
});

export const calendarEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200),
  project_id: z.string().uuid().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  platform: z.string().nullable().optional(),
  scheduled_date: z.string().min(1, "Date is required"),
  status: z.enum(["planned", "ready", "published"]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// Inferred types
export type BrandKitFormData = z.infer<typeof brandKitSchema>;
export type CampaignFormData = z.infer<typeof campaignSchema>;
export type ProjectBriefFormData = z.infer<typeof projectBriefSchema>;
export type SceneFormData = z.infer<typeof sceneSchema>;
export type TemplateFormData = z.infer<typeof templateSchema>;
export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;
export type AdDeploymentFormData = z.infer<typeof adDeploymentSchema>;
export type ApiKeysFormData = z.infer<typeof apiKeysSchema>;
