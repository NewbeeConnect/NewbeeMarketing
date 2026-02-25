export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Domain types (defined before Database for use in table types)
export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  text?: string;
};

export type BrandFonts = {
  heading: string;
  body: string;
  caption?: string;
};

export type ProjectStrategy = {
  hook: string;
  narrative_arc: string;
  key_messages: string[];
  cta: string;
  recommended_duration: number;
  recommended_scenes: number;
  music_mood: string;
};

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type ProjectStatus =
  | "draft"
  | "strategy_pending"
  | "strategy_ready"
  | "scenes_pending"
  | "scenes_ready"
  | "prompts_pending"
  | "prompts_ready"
  | "generating"
  | "post_production"
  | "completed"
  | "archived";

export type AudioType = "native_veo" | "tts_voiceover" | "silent";
export type GenerationType = "video" | "image" | "voiceover" | "stitched";
export type GenerationStatus = "pending" | "queued" | "processing" | "completed" | "failed";
export type TemplateCategory = "app_demo" | "feature_showcase" | "testimonial" | "event_promo" | "brand_awareness" | "general";
export type NotificationType = "generation_complete" | "generation_failed" | "budget_alert";
export type AdPlatform = "google" | "meta";
export type AdDeploymentStatus = "draft" | "pending_review" | "active" | "paused" | "completed" | "rejected";
export type VersionType = "emotional" | "technical" | "single";

export type AdTargeting = {
  age_range: [number, number];
  locations: string[];
  interests: string[];
  languages: string[];
};

export type Database = {
  public: {
    Tables: {
      mkt_brand_kit: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_light_url: string | null;
          logo_dark_url: string | null;
          colors: BrandColors | null;
          fonts: BrandFonts | null;
          brand_voice: string | null;
          watermark_url: string | null;
          watermark_position: string | null;
          watermark_opacity: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          logo_light_url?: string | null;
          logo_dark_url?: string | null;
          colors?: BrandColors | null;
          fonts?: BrandFonts | null;
          brand_voice?: string | null;
          watermark_url?: string | null;
          watermark_position?: string | null;
          watermark_opacity?: number | null;
        };
        Update: {
          user_id?: string;
          name?: string;
          logo_light_url?: string | null;
          logo_dark_url?: string | null;
          colors?: BrandColors | null;
          fonts?: BrandFonts | null;
          brand_voice?: string | null;
          watermark_url?: string | null;
          watermark_position?: string | null;
          watermark_opacity?: number | null;
        };
        Relationships: [];
      };
      mkt_brand_assets: {
        Row: {
          id: string;
          brand_kit_id: string;
          name: string;
          type: "image" | "video" | "screenshot";
          url: string;
          thumbnail_url: string | null;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          brand_kit_id: string;
          name: string;
          type: "image" | "video" | "screenshot";
          url: string;
          thumbnail_url?: string | null;
          tags?: string[] | null;
        };
        Update: {
          brand_kit_id?: string;
          name?: string;
          type?: "image" | "video" | "screenshot";
          url?: string;
          thumbnail_url?: string | null;
          tags?: string[] | null;
        };
        Relationships: [];
      };
      mkt_campaigns: {
        Row: {
          id: string;
          user_id: string;
          brand_kit_id: string | null;
          name: string;
          description: string | null;
          objective: string | null;
          start_date: string | null;
          end_date: string | null;
          budget_limit_usd: number | null;
          current_spend_usd: number;
          status: CampaignStatus;
          ad_platforms: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          brand_kit_id?: string | null;
          name: string;
          description?: string | null;
          objective?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          budget_limit_usd?: number | null;
          status?: CampaignStatus;
          ad_platforms?: string[] | null;
        };
        Update: {
          user_id?: string;
          brand_kit_id?: string | null;
          name?: string;
          description?: string | null;
          objective?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          budget_limit_usd?: number | null;
          current_spend_usd?: number;
          status?: CampaignStatus;
          ad_platforms?: string[] | null;
        };
        Relationships: [];
      };
      mkt_projects: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          brand_kit_id: string | null;
          title: string;
          description: string | null;
          product_name: string;
          product_description: string | null;
          target_platforms: string[];
          target_audience: string | null;
          languages: string[];
          style: string;
          tone: string;
          additional_notes: string | null;
          strategy: ProjectStrategy | null;
          strategy_approved: boolean;
          status: ProjectStatus;
          current_step: number;
          is_ab_variant: boolean;
          parent_project_id: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id?: string | null;
          brand_kit_id?: string | null;
          title: string;
          description?: string | null;
          product_name: string;
          product_description?: string | null;
          target_platforms: string[];
          target_audience?: string | null;
          languages: string[];
          style: string;
          tone: string;
          additional_notes?: string | null;
          strategy?: ProjectStrategy | null;
          strategy_approved?: boolean;
          status?: ProjectStatus;
          current_step?: number;
          is_ab_variant?: boolean;
          parent_project_id?: string | null;
          source_url?: string | null;
        };
        Update: {
          user_id?: string;
          campaign_id?: string | null;
          brand_kit_id?: string | null;
          title?: string;
          description?: string | null;
          product_name?: string;
          product_description?: string | null;
          target_platforms?: string[];
          target_audience?: string | null;
          languages?: string[];
          style?: string;
          tone?: string;
          additional_notes?: string | null;
          strategy?: ProjectStrategy | null;
          strategy_approved?: boolean;
          status?: ProjectStatus;
          current_step?: number;
          is_ab_variant?: boolean;
          parent_project_id?: string | null;
          source_url?: string | null;
        };
        Relationships: [];
      };
      mkt_project_versions: {
        Row: {
          id: string;
          project_id: string;
          step: "strategy" | "scenes" | "prompts";
          version_number: number;
          snapshot: Json;
          change_description: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          step: "strategy" | "scenes" | "prompts";
          version_number: number;
          snapshot: Json;
          change_description?: string | null;
        };
        Update: {
          project_id?: string;
          step?: "strategy" | "scenes" | "prompts";
          version_number?: number;
          snapshot?: Json;
          change_description?: string | null;
        };
        Relationships: [];
      };
      mkt_scenes: {
        Row: {
          id: string;
          project_id: string;
          scene_number: number;
          title: string;
          description: string;
          duration_seconds: number;
          aspect_ratio: string;
          resolution: string;
          user_prompt: string | null;
          optimized_prompt: string | null;
          negative_prompt: string | null;
          prompt_approved: boolean;
          camera_movement: string | null;
          lighting: string | null;
          text_overlay: string | null;
          audio_type: AudioType;
          voiceover_text: string | null;
          voiceover_language: string | null;
          voiceover_voice: string | null;
          reference_image_urls: string[] | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          scene_number: number;
          title: string;
          description: string;
          duration_seconds: number;
          aspect_ratio?: string;
          resolution?: string;
          user_prompt?: string | null;
          optimized_prompt?: string | null;
          negative_prompt?: string | null;
          prompt_approved?: boolean;
          camera_movement?: string | null;
          lighting?: string | null;
          text_overlay?: string | null;
          audio_type?: AudioType;
          voiceover_text?: string | null;
          voiceover_language?: string | null;
          voiceover_voice?: string | null;
          reference_image_urls?: string[] | null;
          sort_order?: number;
        };
        Update: {
          project_id?: string;
          scene_number?: number;
          title?: string;
          description?: string;
          duration_seconds?: number;
          aspect_ratio?: string;
          resolution?: string;
          user_prompt?: string | null;
          optimized_prompt?: string | null;
          negative_prompt?: string | null;
          prompt_approved?: boolean;
          camera_movement?: string | null;
          lighting?: string | null;
          text_overlay?: string | null;
          audio_type?: AudioType;
          voiceover_text?: string | null;
          voiceover_language?: string | null;
          voiceover_voice?: string | null;
          reference_image_urls?: string[] | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      mkt_generations: {
        Row: {
          id: string;
          project_id: string;
          scene_id: string | null;
          type: GenerationType;
          prompt: string;
          model: string;
          config: Json | null;
          language: string | null;
          platform: string | null;
          aspect_ratio: string | null;
          operation_name: string | null;
          status: GenerationStatus;
          output_url: string | null;
          thumbnail_url: string | null;
          output_metadata: Json | null;
          estimated_cost_usd: number | null;
          actual_cost_usd: number | null;
          error_message: string | null;
          retry_count: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          scene_id?: string | null;
          type: GenerationType;
          prompt: string;
          model: string;
          config?: Json | null;
          language?: string | null;
          platform?: string | null;
          aspect_ratio?: string | null;
          operation_name?: string | null;
          status?: GenerationStatus;
          output_url?: string | null;
          thumbnail_url?: string | null;
          output_metadata?: Json | null;
          estimated_cost_usd?: number | null;
          actual_cost_usd?: number | null;
          error_message?: string | null;
          retry_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          project_id?: string;
          scene_id?: string | null;
          type?: GenerationType;
          prompt?: string;
          model?: string;
          config?: Json | null;
          language?: string | null;
          platform?: string | null;
          aspect_ratio?: string | null;
          operation_name?: string | null;
          status?: GenerationStatus;
          output_url?: string | null;
          thumbnail_url?: string | null;
          output_metadata?: Json | null;
          estimated_cost_usd?: number | null;
          actual_cost_usd?: number | null;
          error_message?: string | null;
          retry_count?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      mkt_captions: {
        Row: {
          id: string;
          generation_id: string;
          language: string;
          srt_content: string;
          is_embedded: boolean;
          created_at: string;
        };
        Insert: {
          generation_id: string;
          language: string;
          srt_content: string;
          is_embedded?: boolean;
        };
        Update: {
          generation_id?: string;
          language?: string;
          srt_content?: string;
          is_embedded?: boolean;
        };
        Relationships: [];
      };
      mkt_templates: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: TemplateCategory;
          platform: string | null;
          style: string | null;
          tone: string | null;
          brief_template: Json | null;
          scene_templates: Json | null;
          prompt_patterns: Json | null;
          use_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          category?: TemplateCategory;
          platform?: string | null;
          style?: string | null;
          tone?: string | null;
          brief_template?: Json | null;
          scene_templates?: Json | null;
          prompt_patterns?: Json | null;
          use_count?: number;
        };
        Update: {
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: TemplateCategory;
          platform?: string | null;
          style?: string | null;
          tone?: string | null;
          brief_template?: Json | null;
          scene_templates?: Json | null;
          prompt_patterns?: Json | null;
          use_count?: number;
        };
        Relationships: [];
      };
      mkt_calendar_events: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          campaign_id: string | null;
          title: string;
          platform: string | null;
          scheduled_date: string;
          status: "planned" | "ready" | "published";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          project_id?: string | null;
          campaign_id?: string | null;
          title: string;
          platform?: string | null;
          scheduled_date: string;
          status?: "planned" | "ready" | "published";
          notes?: string | null;
        };
        Update: {
          user_id?: string;
          project_id?: string | null;
          campaign_id?: string | null;
          title?: string;
          platform?: string | null;
          scheduled_date?: string;
          status?: "planned" | "ready" | "published";
          notes?: string | null;
        };
        Relationships: [];
      };
      mkt_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          campaign_id: string | null;
          generation_id: string | null;
          api_service: "gemini" | "veo" | "imagen" | "tts";
          model: string;
          operation: string;
          input_tokens: number | null;
          output_tokens: number | null;
          duration_seconds: number | null;
          estimated_cost_usd: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          project_id?: string | null;
          campaign_id?: string | null;
          generation_id?: string | null;
          api_service: "gemini" | "veo" | "imagen" | "tts";
          model: string;
          operation: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          duration_seconds?: number | null;
          estimated_cost_usd?: number | null;
        };
        Update: {
          user_id?: string;
          project_id?: string | null;
          campaign_id?: string | null;
          generation_id?: string | null;
          api_service?: "gemini" | "veo" | "imagen" | "tts";
          model?: string;
          operation?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          duration_seconds?: number | null;
          estimated_cost_usd?: number | null;
        };
        Relationships: [];
      };
      mkt_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
        };
        Update: {
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
      };
      mkt_api_keys: {
        Row: {
          id: string;
          user_id: string;
          platform: "google_ads" | "meta_ads";
          keys_encrypted: Json;
          is_valid: boolean;
          last_validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          platform: "google_ads" | "meta_ads";
          keys_encrypted: Json;
          is_valid?: boolean;
          last_validated_at?: string | null;
        };
        Update: {
          user_id?: string;
          platform?: "google_ads" | "meta_ads";
          keys_encrypted?: Json;
          is_valid?: boolean;
          last_validated_at?: string | null;
        };
        Relationships: [];
      };
      mkt_ad_deployments: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          project_id: string;
          platform: AdPlatform;
          external_campaign_id: string | null;
          external_ad_id: string | null;
          creative_urls: string[];
          budget_daily_usd: number | null;
          budget_total_usd: number | null;
          targeting: AdTargeting | null;
          status: AdDeploymentStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id?: string | null;
          project_id: string;
          platform: AdPlatform;
          external_campaign_id?: string | null;
          external_ad_id?: string | null;
          creative_urls: string[];
          budget_daily_usd?: number | null;
          budget_total_usd?: number | null;
          targeting?: AdTargeting | null;
          status?: AdDeploymentStatus;
          published_at?: string | null;
        };
        Update: {
          user_id?: string;
          campaign_id?: string | null;
          project_id?: string;
          platform?: AdPlatform;
          external_campaign_id?: string | null;
          external_ad_id?: string | null;
          creative_urls?: string[];
          budget_daily_usd?: number | null;
          budget_total_usd?: number | null;
          targeting?: AdTargeting | null;
          status?: AdDeploymentStatus;
          published_at?: string | null;
        };
        Relationships: [];
      };
      mkt_campaign_performance: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          deployment_id: string | null;
          project_id: string | null;
          platform: string;
          date: string;
          impressions: number;
          clicks: number;
          ctr: number;
          conversions: number;
          conversion_rate: number;
          spend_usd: number;
          version_type: VersionType | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id: string;
          deployment_id?: string | null;
          project_id?: string | null;
          platform: string;
          date: string;
          impressions?: number;
          clicks?: number;
          ctr?: number;
          conversions?: number;
          conversion_rate?: number;
          spend_usd?: number;
          version_type?: VersionType | null;
        };
        Update: {
          user_id?: string;
          campaign_id?: string;
          deployment_id?: string | null;
          project_id?: string | null;
          platform?: string;
          date?: string;
          impressions?: number;
          clicks?: number;
          ctr?: number;
          conversions?: number;
          conversion_rate?: number;
          spend_usd?: number;
          version_type?: VersionType | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Helper types for table rows
export type BrandKit = Database["public"]["Tables"]["mkt_brand_kit"]["Row"];
export type BrandAsset = Database["public"]["Tables"]["mkt_brand_assets"]["Row"];
export type Campaign = Database["public"]["Tables"]["mkt_campaigns"]["Row"];
export type Project = Database["public"]["Tables"]["mkt_projects"]["Row"];
export type ProjectVersion = Database["public"]["Tables"]["mkt_project_versions"]["Row"];
export type Scene = Database["public"]["Tables"]["mkt_scenes"]["Row"];
export type Generation = Database["public"]["Tables"]["mkt_generations"]["Row"];
export type Caption = Database["public"]["Tables"]["mkt_captions"]["Row"];
export type Template = Database["public"]["Tables"]["mkt_templates"]["Row"];
export type CalendarEvent = Database["public"]["Tables"]["mkt_calendar_events"]["Row"];
export type UsageLog = Database["public"]["Tables"]["mkt_usage_logs"]["Row"];
export type Notification = Database["public"]["Tables"]["mkt_notifications"]["Row"];
export type ApiKey = Database["public"]["Tables"]["mkt_api_keys"]["Row"];
export type AdDeployment = Database["public"]["Tables"]["mkt_ad_deployments"]["Row"];
export type CampaignPerformance = Database["public"]["Tables"]["mkt_campaign_performance"]["Row"];
