-- Migration: Phone Mockup Support
-- Adds phone_mockup_config JSONB to scenes and mockup_image_url

-- First ensure mkt_scenes table exists (create if missing)
CREATE TABLE IF NOT EXISTS public.mkt_scenes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 8 CHECK (duration_seconds IN (4, 6, 8)),
    aspect_ratio TEXT DEFAULT '9:16',
    resolution TEXT DEFAULT '1080p',
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
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add phone mockup config to scenes
ALTER TABLE public.mkt_scenes
  ADD COLUMN IF NOT EXISTS phone_mockup_config JSONB DEFAULT NULL;

-- Add mockup_image_url to store the composited mockup image
ALTER TABLE public.mkt_scenes
  ADD COLUMN IF NOT EXISTS mockup_image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.mkt_scenes.phone_mockup_config IS 'Phone mockup configuration: { templateId, screenshotUrl, backgroundColor }';
COMMENT ON COLUMN public.mkt_scenes.mockup_image_url IS 'URL of the composited phone mockup image (used as Veo firstFrame)';
