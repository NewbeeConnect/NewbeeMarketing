-- Remove orphan columns left on mkt_generations after the projects/campaigns
-- workflow was deleted. Also drops mkt_performance_analyses that migration 013
-- missed, and adds the unique index we need for upserting frames/clips.

ALTER TABLE public.mkt_generations
  DROP COLUMN IF EXISTS project_id,
  DROP COLUMN IF EXISTS scene_id,
  DROP COLUMN IF EXISTS platform,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS optimization_rationale,
  DROP COLUMN IF EXISTS parent_generation_id;

DROP TABLE IF EXISTS public.mkt_performance_analyses CASCADE;

-- Partial unique index so upsert(onConflict: 'story_id,story_role,sequence_index')
-- can race-free replace a frame or clip at a given (story, role, index) slot.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_mkt_gen_story_role_seq
  ON public.mkt_generations(story_id, story_role, sequence_index)
  WHERE story_id IS NOT NULL AND story_role IS NOT NULL;
