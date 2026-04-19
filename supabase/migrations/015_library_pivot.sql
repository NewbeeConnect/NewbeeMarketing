-- Pivot away from the 4-scene continuous-story model toward a Drive-like
-- library of independent image/video assets organized by project + type + ratio.
--
-- Drop mkt_stories entirely (no more story concept). Strip mkt_generations of
-- the story_* columns and add the fields the library needs: which project the
-- asset belongs to, what aspect ratio it was generated at, its human-readable
-- filename, and any reference images that went into the prompt.

-- 1) Drop the story table (and its FK cascades on mkt_generations.story_id)
DROP TABLE IF EXISTS public.mkt_stories CASCADE;

-- 2) Strip legacy story columns from mkt_generations
ALTER TABLE public.mkt_generations
  DROP COLUMN IF EXISTS story_id,
  DROP COLUMN IF EXISTS story_role,
  DROP COLUMN IF EXISTS sequence_index;

-- 3) Add library columns
ALTER TABLE public.mkt_generations
  ADD COLUMN IF NOT EXISTS project_slug TEXT CHECK (project_slug IN ('newbee', 'ateliersayin')),
  ADD COLUMN IF NOT EXISTS ratio TEXT CHECK (ratio IN ('4:5', '9:16', '1:1', '16:9')),
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS reference_urls TEXT[],
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4) Indexes for library navigation
CREATE INDEX IF NOT EXISTS idx_mkt_gen_project ON public.mkt_generations(project_slug);
CREATE INDEX IF NOT EXISTS idx_mkt_gen_project_type_ratio
  ON public.mkt_generations(project_slug, type, ratio);
CREATE INDEX IF NOT EXISTS idx_mkt_gen_user ON public.mkt_generations(user_id);

-- 5) Row-level security on mkt_generations (was RLS-enabled-zero-policies before,
-- which only service role could touch. Now that we're reading from the client
-- via useLibrary, users need to see their own rows).
DROP POLICY IF EXISTS "Users manage own generations" ON public.mkt_generations;
CREATE POLICY "Users manage own generations"
  ON public.mkt_generations
  FOR ALL
  USING (auth.uid() = user_id);
