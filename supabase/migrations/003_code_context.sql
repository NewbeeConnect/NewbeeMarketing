-- Newbee Marketing Hub - Code Context for AI-Enhanced Briefs
-- Migration 003: Adds code context storage for app codebase analysis

-- ============================================
-- 1. CODE CONTEXTS TABLE
-- ============================================
CREATE TABLE public.mkt_code_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('repomix_upload', 'github_pat')),
    repo_url TEXT,
    raw_file_url TEXT,
    analysis JSONB NOT NULL,
    file_tree TEXT,
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_code_contexts_user ON public.mkt_code_contexts(user_id);

ALTER TABLE public.mkt_code_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own code contexts" ON public.mkt_code_contexts
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. ADD code_context_id TO PROJECTS
-- ============================================
ALTER TABLE public.mkt_projects ADD COLUMN IF NOT EXISTS code_context_id UUID
    REFERENCES public.mkt_code_contexts(id) ON DELETE SET NULL;

-- ============================================
-- 3. EXTEND mkt_api_keys PLATFORM CHECK
-- ============================================
-- Drop old constraint and add new one including 'github'
ALTER TABLE public.mkt_api_keys DROP CONSTRAINT IF EXISTS mkt_api_keys_platform_check;
ALTER TABLE public.mkt_api_keys ADD CONSTRAINT mkt_api_keys_platform_check
    CHECK (platform IN ('google_ads', 'meta_ads', 'github'));

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER update_mkt_code_contexts_updated_at
    BEFORE UPDATE ON public.mkt_code_contexts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
