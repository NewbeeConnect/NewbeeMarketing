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
export type NotificationType = "generation_complete" | "generation_failed" | "budget_alert" | "content_pending_review" | "content_published" | "content_failed" | "ab_test_winner" | "trend_detected" | "autopilot_complete";
export type AdPlatform = "google" | "meta";
export type AdDeploymentStatus = "draft" | "pending_review" | "active" | "paused" | "completed" | "rejected";
export type VersionType = "emotional" | "technical" | "single";
export type CodeContextSourceType = "repomix_upload" | "github_pat";
export type ApiKeyPlatform = "google_ads" | "meta_ads" | "github";

// Social automation types
export type SocialPlatformType = "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "facebook";
export type ContentQueueStatus = "draft" | "pending_review" | "approved" | "scheduled" | "publishing" | "published" | "failed" | "rejected" | "revision_requested";
export type ContentSource = "manual" | "autopilot" | "trend" | "ab_test";
export type ABTestStatus = "draft" | "running" | "paused" | "completed" | "cancelled";
export type AllocationStrategy = "equal" | "thompson_sampling" | "epsilon_greedy";
export type ABSuccessMetric = "engagement_rate" | "clicks" | "impressions" | "conversions" | "ctr";
export type ABVariantStrategyType = "emotional" | "technical" | "hybrid" | "trending";
export type TrendTypeEnum = "hashtag" | "topic" | "sound" | "challenge" | "keyword";
export type AutopilotFrequency = "daily" | "weekly" | "biweekly";
export type AutopilotRunStatus = "running" | "completed" | "failed" | "cancelled";

export type PhoneMockupConfig = {
  templateId: string;
  screenshotUrl: string;
  backgroundColor?: string;
};

export type CodeAnalysis = {
  appName: string;
  appType: string;
  techStack: string[];
  mainFeatures: string[];
  keyScreens: string[];
  uiComponents: string[];
  userFlows: string[];
  marketingAngles: string[];
  targetPlatforms: string[];
  monetization: string;
};

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
          code_context_id: string | null;
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
          code_context_id?: string | null;
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
          code_context_id?: string | null;
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
          phone_mockup_config: PhoneMockupConfig | null;
          mockup_image_url: string | null;
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
          phone_mockup_config?: PhoneMockupConfig | null;
          mockup_image_url?: string | null;
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
          phone_mockup_config?: PhoneMockupConfig | null;
          mockup_image_url?: string | null;
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
          platform: ApiKeyPlatform;
          keys_encrypted: Json;
          is_valid: boolean;
          last_validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          platform: ApiKeyPlatform;
          keys_encrypted: Json;
          is_valid?: boolean;
          last_validated_at?: string | null;
        };
        Update: {
          user_id?: string;
          platform?: ApiKeyPlatform;
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
      mkt_code_contexts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          source_type: CodeContextSourceType;
          repo_url: string | null;
          raw_file_url: string | null;
          analysis: CodeAnalysis;
          file_tree: string | null;
          token_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          source_type: CodeContextSourceType;
          repo_url?: string | null;
          raw_file_url?: string | null;
          analysis: CodeAnalysis;
          file_tree?: string | null;
          token_count?: number | null;
        };
        Update: {
          user_id?: string;
          name?: string;
          source_type?: CodeContextSourceType;
          repo_url?: string | null;
          raw_file_url?: string | null;
          analysis?: CodeAnalysis;
          file_tree?: string | null;
          token_count?: number | null;
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
      // ═══════════════════════════════════════════════════════════════════
      // Social Automation Tables (Migration 007)
      // ═══════════════════════════════════════════════════════════════════
      mkt_social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: SocialPlatformType;
          account_name: string;
          account_id: string;
          profile_url: string | null;
          avatar_url: string | null;
          tokens_encrypted: string;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          scopes: string[];
          is_active: boolean;
          last_synced_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          platform: SocialPlatformType;
          account_name: string;
          account_id: string;
          profile_url?: string | null;
          avatar_url?: string | null;
          tokens_encrypted: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          last_synced_at?: string | null;
          metadata?: Json;
        };
        Update: {
          user_id?: string;
          platform?: SocialPlatformType;
          account_name?: string;
          account_id?: string;
          profile_url?: string | null;
          avatar_url?: string | null;
          tokens_encrypted?: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          is_active?: boolean;
          last_synced_at?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      mkt_content_queue: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          project_id: string | null;
          ab_test_id: string | null;
          variant_label: string | null;
          text_content: string;
          media_urls: string[];
          media_type: "video" | "image" | "carousel" | null;
          hashtags: string[];
          target_platforms: string[];
          platform_configs: Json;
          scheduled_at: string | null;
          optimal_time_suggestion: string | null;
          status: ContentQueueStatus;
          rejection_notes: string | null;
          revision_count: number;
          workflow_run_id: string | null;
          hook_token: string | null;
          source: ContentSource;
          trend_id: string | null;
          prompt_template_id: string | null;
          generation_prompt: string | null;
          published_at: string | null;
          platform_post_ids: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id?: string | null;
          project_id?: string | null;
          ab_test_id?: string | null;
          variant_label?: string | null;
          text_content: string;
          media_urls?: string[];
          media_type?: "video" | "image" | "carousel" | null;
          hashtags?: string[];
          target_platforms: string[];
          platform_configs?: Json;
          scheduled_at?: string | null;
          optimal_time_suggestion?: string | null;
          status?: ContentQueueStatus;
          rejection_notes?: string | null;
          revision_count?: number;
          workflow_run_id?: string | null;
          hook_token?: string | null;
          source?: ContentSource;
          trend_id?: string | null;
          prompt_template_id?: string | null;
          generation_prompt?: string | null;
          published_at?: string | null;
          platform_post_ids?: Json;
        };
        Update: {
          user_id?: string;
          campaign_id?: string | null;
          project_id?: string | null;
          ab_test_id?: string | null;
          variant_label?: string | null;
          text_content?: string;
          media_urls?: string[];
          media_type?: "video" | "image" | "carousel" | null;
          hashtags?: string[];
          target_platforms?: string[];
          platform_configs?: Json;
          scheduled_at?: string | null;
          optimal_time_suggestion?: string | null;
          status?: ContentQueueStatus;
          rejection_notes?: string | null;
          revision_count?: number;
          workflow_run_id?: string | null;
          hook_token?: string | null;
          source?: ContentSource;
          trend_id?: string | null;
          prompt_template_id?: string | null;
          generation_prompt?: string | null;
          published_at?: string | null;
          platform_post_ids?: Json;
        };
        Relationships: [];
      };
      mkt_social_post_metrics: {
        Row: {
          id: string;
          user_id: string;
          content_queue_id: string;
          platform: string;
          external_post_id: string | null;
          date: string;
          impressions: number;
          reach: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          clicks: number;
          engagement_rate: number;
          video_views: number;
          watch_time_seconds: number;
          completion_rate: number;
          followers_gained: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          content_queue_id: string;
          platform: string;
          external_post_id?: string | null;
          date: string;
          impressions?: number;
          reach?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          clicks?: number;
          engagement_rate?: number;
          video_views?: number;
          watch_time_seconds?: number;
          completion_rate?: number;
          followers_gained?: number;
        };
        Update: {
          user_id?: string;
          content_queue_id?: string;
          platform?: string;
          external_post_id?: string | null;
          date?: string;
          impressions?: number;
          reach?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          clicks?: number;
          engagement_rate?: number;
          video_views?: number;
          watch_time_seconds?: number;
          completion_rate?: number;
          followers_gained?: number;
        };
        Relationships: [];
      };
      mkt_ab_tests: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          name: string;
          hypothesis: string | null;
          status: ABTestStatus;
          variant_count: number;
          allocation_strategy: AllocationStrategy;
          current_allocations: Json;
          success_metric: ABSuccessMetric;
          confidence_level: number;
          min_sample_size: number;
          max_duration_days: number;
          winner_variant: string | null;
          winner_declared_at: string | null;
          significance_p_value: number | null;
          workflow_run_id: string | null;
          started_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          campaign_id?: string | null;
          name: string;
          hypothesis?: string | null;
          status?: ABTestStatus;
          variant_count?: number;
          allocation_strategy?: AllocationStrategy;
          current_allocations?: Json;
          success_metric?: ABSuccessMetric;
          confidence_level?: number;
          min_sample_size?: number;
          max_duration_days?: number;
          winner_variant?: string | null;
          winner_declared_at?: string | null;
          significance_p_value?: number | null;
          workflow_run_id?: string | null;
          started_at?: string | null;
        };
        Update: {
          user_id?: string;
          campaign_id?: string | null;
          name?: string;
          hypothesis?: string | null;
          status?: ABTestStatus;
          variant_count?: number;
          allocation_strategy?: AllocationStrategy;
          current_allocations?: Json;
          success_metric?: ABSuccessMetric;
          confidence_level?: number;
          min_sample_size?: number;
          max_duration_days?: number;
          winner_variant?: string | null;
          winner_declared_at?: string | null;
          significance_p_value?: number | null;
          workflow_run_id?: string | null;
          started_at?: string | null;
        };
        Relationships: [];
      };
      mkt_ab_test_variants: {
        Row: {
          id: string;
          ab_test_id: string;
          label: string;
          content_queue_id: string | null;
          strategy_type: ABVariantStrategyType | null;
          allocation_pct: number;
          total_impressions: number;
          total_clicks: number;
          total_engagement: number;
          engagement_rate: number;
          is_winner: boolean;
          created_at: string;
        };
        Insert: {
          ab_test_id: string;
          label: string;
          content_queue_id?: string | null;
          strategy_type?: ABVariantStrategyType | null;
          allocation_pct?: number;
          total_impressions?: number;
          total_clicks?: number;
          total_engagement?: number;
          engagement_rate?: number;
          is_winner?: boolean;
        };
        Update: {
          ab_test_id?: string;
          label?: string;
          content_queue_id?: string | null;
          strategy_type?: ABVariantStrategyType | null;
          allocation_pct?: number;
          total_impressions?: number;
          total_clicks?: number;
          total_engagement?: number;
          engagement_rate?: number;
          is_winner?: boolean;
        };
        Relationships: [];
      };
      mkt_trends: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          trend_type: TrendTypeEnum;
          name: string;
          description: string | null;
          volume: number | null;
          growth_rate: number | null;
          virality_score: number;
          brand_relevance_score: number;
          composite_score: number;
          source_url: string | null;
          metadata: Json;
          detected_at: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          platform: string;
          trend_type: TrendTypeEnum;
          name: string;
          description?: string | null;
          volume?: number | null;
          growth_rate?: number | null;
          virality_score?: number;
          brand_relevance_score?: number;
          composite_score?: number;
          source_url?: string | null;
          metadata?: Json;
          detected_at?: string;
          expires_at?: string | null;
        };
        Update: {
          user_id?: string;
          platform?: string;
          trend_type?: TrendTypeEnum;
          name?: string;
          description?: string | null;
          volume?: number | null;
          growth_rate?: number | null;
          virality_score?: number;
          brand_relevance_score?: number;
          composite_score?: number;
          source_url?: string | null;
          metadata?: Json;
          detected_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      mkt_prompt_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          template_text: string;
          platform: string | null;
          content_format: string | null;
          version: number;
          parent_template_id: string | null;
          avg_engagement_rate: number;
          avg_ctr: number;
          performance_score: number;
          use_count: number;
          variables: Json;
          few_shot_examples: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          template_text: string;
          platform?: string | null;
          content_format?: string | null;
          version?: number;
          parent_template_id?: string | null;
          avg_engagement_rate?: number;
          avg_ctr?: number;
          performance_score?: number;
          use_count?: number;
          variables?: Json;
          few_shot_examples?: Json;
          is_active?: boolean;
        };
        Update: {
          user_id?: string;
          name?: string;
          template_text?: string;
          platform?: string | null;
          content_format?: string | null;
          version?: number;
          parent_template_id?: string | null;
          avg_engagement_rate?: number;
          avg_ctr?: number;
          performance_score?: number;
          use_count?: number;
          variables?: Json;
          few_shot_examples?: Json;
          is_active?: boolean;
        };
        Relationships: [];
      };
      mkt_autopilot_config: {
        Row: {
          id: string;
          user_id: string;
          is_enabled: boolean;
          auto_generate: boolean;
          auto_publish: boolean;
          frequency: AutopilotFrequency;
          target_platforms: string[];
          brand_kit_id: string | null;
          monthly_budget_usd: number;
          content_types: string[];
          preferred_posting_times: Json;
          style_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          is_enabled?: boolean;
          auto_generate?: boolean;
          auto_publish?: boolean;
          frequency?: AutopilotFrequency;
          target_platforms?: string[];
          brand_kit_id?: string | null;
          monthly_budget_usd?: number;
          content_types?: string[];
          preferred_posting_times?: Json;
          style_preferences?: Json;
        };
        Update: {
          user_id?: string;
          is_enabled?: boolean;
          auto_generate?: boolean;
          auto_publish?: boolean;
          frequency?: AutopilotFrequency;
          target_platforms?: string[];
          brand_kit_id?: string | null;
          monthly_budget_usd?: number;
          content_types?: string[];
          preferred_posting_times?: Json;
          style_preferences?: Json;
        };
        Relationships: [];
      };
      mkt_autopilot_runs: {
        Row: {
          id: string;
          user_id: string;
          workflow_run_id: string | null;
          status: AutopilotRunStatus;
          analysis_summary: Json | null;
          trends_found: number;
          content_generated: number;
          content_published: number;
          ai_cost_usd: number;
          duration_seconds: number | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          workflow_run_id?: string | null;
          status?: AutopilotRunStatus;
          analysis_summary?: Json | null;
          trends_found?: number;
          content_generated?: number;
          content_published?: number;
          ai_cost_usd?: number;
          duration_seconds?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          workflow_run_id?: string | null;
          status?: AutopilotRunStatus;
          analysis_summary?: Json | null;
          trends_found?: number;
          content_generated?: number;
          content_published?: number;
          ai_cost_usd?: number;
          duration_seconds?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
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
export type CodeContext = Database["public"]["Tables"]["mkt_code_contexts"]["Row"];

// Social Automation helper types
export type SocialAccount = Database["public"]["Tables"]["mkt_social_accounts"]["Row"];
export type ContentQueueItem = Database["public"]["Tables"]["mkt_content_queue"]["Row"];
export type SocialPostMetric = Database["public"]["Tables"]["mkt_social_post_metrics"]["Row"];
export type ABTest = Database["public"]["Tables"]["mkt_ab_tests"]["Row"];
export type ABTestVariant = Database["public"]["Tables"]["mkt_ab_test_variants"]["Row"];
export type Trend = Database["public"]["Tables"]["mkt_trends"]["Row"];
export type PromptTemplate = Database["public"]["Tables"]["mkt_prompt_templates"]["Row"];
export type AutopilotConfig = Database["public"]["Tables"]["mkt_autopilot_config"]["Row"];
export type AutopilotRun = Database["public"]["Tables"]["mkt_autopilot_runs"]["Row"];
