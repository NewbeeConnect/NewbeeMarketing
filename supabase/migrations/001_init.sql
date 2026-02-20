-- Newbee Marketing Hub - Initial Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. BRAND KIT
-- ============================================
CREATE TABLE public.mkt_brand_kit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_light_url TEXT,
    logo_dark_url TEXT,
    colors JSONB,
    fonts JSONB,
    brand_voice TEXT,
    watermark_url TEXT,
    watermark_position TEXT DEFAULT 'bottom-right',
    watermark_opacity REAL DEFAULT 0.3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_brand_kit_user ON public.mkt_brand_kit(user_id);

ALTER TABLE public.mkt_brand_kit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand kits" ON public.mkt_brand_kit FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. BRAND ASSETS
-- ============================================
CREATE TABLE public.mkt_brand_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_kit_id UUID NOT NULL REFERENCES public.mkt_brand_kit(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'screenshot')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_brand_assets_kit ON public.mkt_brand_assets(brand_kit_id);

ALTER TABLE public.mkt_brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage assets of own brand kits" ON public.mkt_brand_assets FOR ALL
USING (EXISTS (SELECT 1 FROM public.mkt_brand_kit WHERE id = mkt_brand_assets.brand_kit_id AND user_id = auth.uid()));

-- ============================================
-- 3. CAMPAIGNS
-- ============================================
CREATE TABLE public.mkt_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_kit_id UUID REFERENCES public.mkt_brand_kit(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    start_date DATE,
    end_date DATE,
    budget_limit_usd DECIMAL(10,2),
    current_spend_usd DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_campaigns_user ON public.mkt_campaigns(user_id);
CREATE INDEX idx_mkt_campaigns_status ON public.mkt_campaigns(status);

ALTER TABLE public.mkt_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.mkt_campaigns FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. PROJECTS
-- ============================================
CREATE TABLE public.mkt_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
    brand_kit_id UUID REFERENCES public.mkt_brand_kit(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    product_name TEXT NOT NULL,
    product_description TEXT,
    target_platforms TEXT[] DEFAULT ARRAY['instagram_reels'],
    target_audience TEXT,
    languages TEXT[] DEFAULT ARRAY['en'],
    style TEXT DEFAULT 'modern',
    tone TEXT DEFAULT 'professional',
    additional_notes TEXT,
    strategy JSONB,
    strategy_approved BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'strategy_pending', 'strategy_ready', 'scenes_pending', 'scenes_ready',
        'prompts_pending', 'prompts_ready', 'generating', 'post_production', 'completed', 'archived'
    )),
    current_step INTEGER DEFAULT 1,
    is_ab_variant BOOLEAN DEFAULT false,
    parent_project_id UUID REFERENCES public.mkt_projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_projects_user ON public.mkt_projects(user_id);
CREATE INDEX idx_mkt_projects_campaign ON public.mkt_projects(campaign_id);
CREATE INDEX idx_mkt_projects_status ON public.mkt_projects(status);

ALTER TABLE public.mkt_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects" ON public.mkt_projects FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. PROJECT VERSIONS
-- ============================================
CREATE TABLE public.mkt_project_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.mkt_projects(id) ON DELETE CASCADE,
    step TEXT NOT NULL CHECK (step IN ('strategy', 'scenes', 'prompts')),
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    change_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_project_versions_project ON public.mkt_project_versions(project_id);

ALTER TABLE public.mkt_project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage versions of own projects" ON public.mkt_project_versions FOR ALL
USING (EXISTS (SELECT 1 FROM public.mkt_projects WHERE id = mkt_project_versions.project_id AND user_id = auth.uid()));

-- ============================================
-- 6. SCENES
-- ============================================
CREATE TABLE public.mkt_scenes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.mkt_projects(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 8 CHECK (duration_seconds IN (4, 6, 8)),
    aspect_ratio TEXT DEFAULT '9:16',
    resolution TEXT DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '4k')),
    user_prompt TEXT,
    optimized_prompt TEXT,
    negative_prompt TEXT,
    prompt_approved BOOLEAN DEFAULT false,
    camera_movement TEXT,
    lighting TEXT,
    text_overlay TEXT,
    audio_type TEXT DEFAULT 'native_veo' CHECK (audio_type IN ('native_veo', 'tts_voiceover', 'silent')),
    voiceover_text TEXT,
    voiceover_language TEXT,
    voiceover_voice TEXT,
    reference_image_urls TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, scene_number)
);

CREATE INDEX idx_mkt_scenes_project ON public.mkt_scenes(project_id);

ALTER TABLE public.mkt_scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage scenes of own projects" ON public.mkt_scenes FOR ALL
USING (EXISTS (SELECT 1 FROM public.mkt_projects WHERE id = mkt_scenes.project_id AND user_id = auth.uid()));

-- ============================================
-- 7. GENERATIONS
-- ============================================
CREATE TABLE public.mkt_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.mkt_projects(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.mkt_scenes(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'image', 'voiceover', 'stitched')),
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    config JSONB,
    language TEXT,
    platform TEXT,
    aspect_ratio TEXT,
    operation_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
    output_url TEXT,
    thumbnail_url TEXT,
    output_metadata JSONB,
    estimated_cost_usd DECIMAL(10,4),
    actual_cost_usd DECIMAL(10,4),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_generations_project ON public.mkt_generations(project_id);
CREATE INDEX idx_mkt_generations_scene ON public.mkt_generations(scene_id);
CREATE INDEX idx_mkt_generations_status ON public.mkt_generations(status);

ALTER TABLE public.mkt_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage generations of own projects" ON public.mkt_generations FOR ALL
USING (EXISTS (SELECT 1 FROM public.mkt_projects WHERE id = mkt_generations.project_id AND user_id = auth.uid()));

-- ============================================
-- 8. CAPTIONS
-- ============================================
CREATE TABLE public.mkt_captions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generation_id UUID NOT NULL REFERENCES public.mkt_generations(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    srt_content TEXT NOT NULL,
    is_embedded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_captions_generation ON public.mkt_captions(generation_id);

ALTER TABLE public.mkt_captions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage captions of own generations" ON public.mkt_captions FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.mkt_generations g
    JOIN public.mkt_projects p ON g.project_id = p.id
    WHERE g.id = mkt_captions.generation_id AND p.user_id = auth.uid()
));

-- ============================================
-- 9. TEMPLATES
-- ============================================
CREATE TABLE public.mkt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN (
        'app_demo', 'feature_showcase', 'testimonial', 'event_promo', 'brand_awareness', 'general'
    )),
    platform TEXT,
    style TEXT,
    tone TEXT,
    brief_template JSONB,
    scene_templates JSONB,
    prompt_patterns JSONB,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_templates_user ON public.mkt_templates(user_id);

ALTER TABLE public.mkt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON public.mkt_templates FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 10. CALENDAR EVENTS
-- ============================================
CREATE TABLE public.mkt_calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.mkt_projects(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    platform TEXT,
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ready', 'published')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_calendar_user ON public.mkt_calendar_events(user_id);
CREATE INDEX idx_mkt_calendar_date ON public.mkt_calendar_events(scheduled_date);

ALTER TABLE public.mkt_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calendar events" ON public.mkt_calendar_events FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 11. USAGE LOGS
-- ============================================
CREATE TABLE public.mkt_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.mkt_projects(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
    generation_id UUID REFERENCES public.mkt_generations(id) ON DELETE SET NULL,
    api_service TEXT NOT NULL CHECK (api_service IN ('gemini', 'veo', 'imagen', 'tts')),
    model TEXT NOT NULL,
    operation TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    duration_seconds REAL,
    estimated_cost_usd DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_usage_user ON public.mkt_usage_logs(user_id);
CREATE INDEX idx_mkt_usage_service ON public.mkt_usage_logs(api_service);
CREATE INDEX idx_mkt_usage_created ON public.mkt_usage_logs(created_at);

ALTER TABLE public.mkt_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage logs" ON public.mkt_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts usage logs" ON public.mkt_usage_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
CREATE TABLE public.mkt_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('generation_complete', 'generation_failed', 'budget_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_notifications_user ON public.mkt_notifications(user_id);
CREATE INDEX idx_mkt_notifications_unread ON public.mkt_notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.mkt_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON public.mkt_notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('mkt-assets', 'mkt-assets', true, 524288000) -- 500MB limit
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mkt-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read access for mkt-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'mkt-assets');

CREATE POLICY "Users delete own mkt-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'mkt-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mkt_brand_kit_updated_at BEFORE UPDATE ON public.mkt_brand_kit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_campaigns_updated_at BEFORE UPDATE ON public.mkt_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_projects_updated_at BEFORE UPDATE ON public.mkt_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_scenes_updated_at BEFORE UPDATE ON public.mkt_scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_templates_updated_at BEFORE UPDATE ON public.mkt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_calendar_events_updated_at BEFORE UPDATE ON public.mkt_calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
