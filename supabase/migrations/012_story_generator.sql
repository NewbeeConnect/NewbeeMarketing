-- Continuous story video generator — 4 scenes / 5 keyframes
-- Backs the /generate flow that replaces the old projects/campaigns workflow.

CREATE TABLE IF NOT EXISTS public.mkt_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('9:16', '16:9', '1:1')),
  duration_per_clip_seconds INT NOT NULL CHECK (duration_per_clip_seconds IN (4, 6, 8)),
  model_tier TEXT NOT NULL CHECK (model_tier IN ('fast', 'standard')),
  style_anchor TEXT,
  scene_scripts JSONB NOT NULL DEFAULT '{}'::jsonb,
  frame_prompts JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
  stitched_generation_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_stories_user ON public.mkt_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_stories_status ON public.mkt_stories(status);

ALTER TABLE public.mkt_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stories" ON public.mkt_stories;
CREATE POLICY "Users manage own stories"
  ON public.mkt_stories
  FOR ALL
  USING (auth.uid() = user_id);

-- Extend mkt_generations to track its role inside a story
ALTER TABLE public.mkt_generations
  ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES public.mkt_stories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS story_role TEXT CHECK (story_role IN ('frame', 'clip', 'stitched')),
  ADD COLUMN IF NOT EXISTS sequence_index INT;

-- project_id and scene_id become nullable (legacy workflow is going away)
ALTER TABLE public.mkt_generations ALTER COLUMN project_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mkt_generations_story
  ON public.mkt_generations(story_id, story_role, sequence_index);

-- Stitched type is now a real first-class value
ALTER TABLE public.mkt_generations DROP CONSTRAINT IF EXISTS mkt_generations_type_check;
ALTER TABLE public.mkt_generations
  ADD CONSTRAINT mkt_generations_type_check
  CHECK (type IN ('video', 'image', 'voiceover', 'stitched'));
