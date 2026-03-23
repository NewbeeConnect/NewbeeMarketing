-- Migration 007: Social Media Automation System
-- Adds 9 new tables for social publishing, approval workflows, A/B testing,
-- trend detection, autopilot, and prompt engineering.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. mkt_social_accounts — Connected social media accounts with encrypted OAuth tokens
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  profile_url TEXT,
  avatar_url TEXT,
  tokens_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

ALTER TABLE mkt_social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own social accounts" ON mkt_social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. mkt_prompt_templates — Versioned prompt templates with performance tracking
-- (Created before mkt_content_queue because it's referenced via FK)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  platform TEXT,
  content_format TEXT,
  version INT DEFAULT 1,
  parent_template_id UUID REFERENCES mkt_prompt_templates(id) ON DELETE SET NULL,
  avg_engagement_rate DECIMAL(8,6) DEFAULT 0,
  avg_ctr DECIMAL(8,6) DEFAULT 0,
  performance_score DECIMAL(5,4) DEFAULT 0,
  use_count INT DEFAULT 0,
  variables JSONB DEFAULT '[]',
  few_shot_examples JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mkt_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prompt templates" ON mkt_prompt_templates
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. mkt_trends — Detected trending topics across platforms
-- (Created before mkt_content_queue because it's referenced via FK)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  trend_type TEXT NOT NULL CHECK (trend_type IN ('hashtag', 'topic', 'sound', 'challenge', 'keyword')),
  name TEXT NOT NULL,
  description TEXT,
  volume INT,
  growth_rate DECIMAL(8,4),
  virality_score DECIMAL(5,4) DEFAULT 0,
  brand_relevance_score DECIMAL(5,4) DEFAULT 0,
  composite_score DECIMAL(5,4) DEFAULT 0,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mkt_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trends" ON mkt_trends
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. mkt_ab_tests — A/B test experiments
-- (Created before mkt_content_queue because it's referenced via FK)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES mkt_campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  hypothesis TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  variant_count INT DEFAULT 2,
  allocation_strategy TEXT DEFAULT 'thompson_sampling' CHECK (allocation_strategy IN ('equal', 'thompson_sampling', 'epsilon_greedy')),
  current_allocations JSONB DEFAULT '{}',
  success_metric TEXT DEFAULT 'engagement_rate' CHECK (success_metric IN ('engagement_rate', 'clicks', 'impressions', 'conversions', 'ctr')),
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  min_sample_size INT DEFAULT 1000,
  max_duration_days INT DEFAULT 14,
  winner_variant TEXT,
  winner_declared_at TIMESTAMPTZ,
  significance_p_value DECIMAL(10,8),
  workflow_run_id TEXT,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mkt_ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AB tests" ON mkt_ab_tests
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. mkt_content_queue — Content awaiting approval / scheduled / published
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_content_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES mkt_campaigns(id) ON DELETE SET NULL,
  project_id UUID REFERENCES mkt_projects(id) ON DELETE SET NULL,
  ab_test_id UUID REFERENCES mkt_ab_tests(id) ON DELETE SET NULL,
  variant_label TEXT,

  -- Content
  text_content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('video', 'image', 'carousel')),
  hashtags TEXT[] DEFAULT '{}',

  -- Platform targeting
  target_platforms TEXT[] NOT NULL DEFAULT '{}',
  platform_configs JSONB DEFAULT '{}',

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  optimal_time_suggestion TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'approved', 'scheduled', 'publishing',
    'published', 'failed', 'rejected', 'revision_requested'
  )),
  rejection_notes TEXT,
  revision_count INT DEFAULT 0,

  -- Workflow
  workflow_run_id TEXT,
  hook_token TEXT,

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'autopilot', 'trend', 'ab_test')),
  trend_id UUID REFERENCES mkt_trends(id) ON DELETE SET NULL,
  prompt_template_id UUID REFERENCES mkt_prompt_templates(id) ON DELETE SET NULL,
  generation_prompt TEXT,

  -- Publishing results
  published_at TIMESTAMPTZ,
  platform_post_ids JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mkt_content_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own content queue" ON mkt_content_queue
  FOR ALL USING (auth.uid() = user_id);

-- Service role can update status fields (for workflow steps)
-- Scoped to UPDATE only — not SELECT/INSERT/DELETE
CREATE POLICY "Service role updates content queue" ON mkt_content_queue
  FOR UPDATE USING (auth.role() = 'service_role');

-- Service role can insert (for autopilot content generation)
CREATE POLICY "Service role inserts content queue" ON mkt_content_queue
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. mkt_social_post_metrics — Per-post performance data per platform
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_social_post_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_queue_id UUID NOT NULL REFERENCES mkt_content_queue(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_post_id TEXT,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  clicks INT DEFAULT 0,
  engagement_rate DECIMAL(8,6) DEFAULT 0,
  video_views INT DEFAULT 0,
  watch_time_seconds INT DEFAULT 0,
  completion_rate DECIMAL(5,4) DEFAULT 0,
  followers_gained INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_queue_id, platform, date)
);

ALTER TABLE mkt_social_post_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own post metrics" ON mkt_social_post_metrics
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. mkt_ab_test_variants — Individual variants in an A/B test
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_ab_test_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ab_test_id UUID NOT NULL REFERENCES mkt_ab_tests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  content_queue_id UUID REFERENCES mkt_content_queue(id) ON DELETE SET NULL,
  strategy_type TEXT CHECK (strategy_type IN ('emotional', 'technical', 'hybrid', 'trending')),
  allocation_pct DECIMAL(5,4) DEFAULT 0.5,
  total_impressions INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  engagement_rate DECIMAL(8,6) DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No direct user_id — RLS via ab_test_id join
ALTER TABLE mkt_ab_test_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own AB test variants" ON mkt_ab_test_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM mkt_ab_tests WHERE mkt_ab_tests.id = ab_test_id AND mkt_ab_tests.user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. mkt_autopilot_config — Per-user autopilot settings
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_autopilot_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  auto_generate BOOLEAN DEFAULT false,
  auto_publish BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  target_platforms TEXT[] DEFAULT '{}',
  brand_kit_id UUID REFERENCES mkt_brand_kit(id) ON DELETE SET NULL,
  monthly_budget_usd DECIMAL(10,2) DEFAULT 100,
  content_types TEXT[] DEFAULT ARRAY['feed_post', 'reel'],
  preferred_posting_times JSONB DEFAULT '{}',
  style_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mkt_autopilot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own autopilot config" ON mkt_autopilot_config
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. mkt_autopilot_runs — History of autopilot executions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mkt_autopilot_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_run_id TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  analysis_summary JSONB,
  trends_found INT DEFAULT 0,
  content_generated INT DEFAULT 0,
  content_published INT DEFAULT 0,
  ai_cost_usd DECIMAL(10,4) DEFAULT 0,
  duration_seconds INT,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE mkt_autopilot_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own autopilot runs" ON mkt_autopilot_runs
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_social_accounts_user_platform ON mkt_social_accounts(user_id, platform);
CREATE INDEX idx_content_queue_user_status ON mkt_content_queue(user_id, status);
CREATE INDEX idx_content_queue_scheduled ON mkt_content_queue(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_post_metrics_queue ON mkt_social_post_metrics(content_queue_id, platform);
CREATE INDEX idx_social_post_metrics_date ON mkt_social_post_metrics(user_id, date);
CREATE INDEX idx_ab_tests_user_status ON mkt_ab_tests(user_id, status);
CREATE INDEX idx_trends_user_composite ON mkt_trends(user_id, composite_score DESC);
CREATE INDEX idx_trends_expires ON mkt_trends(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_prompt_templates_user_active ON mkt_prompt_templates(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_prompt_templates_score ON mkt_prompt_templates(performance_score DESC) WHERE is_active = true;
CREATE INDEX idx_autopilot_runs_user ON mkt_autopilot_runs(user_id, started_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Updated_at triggers (reuse pattern from existing tables)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mkt_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_social_accounts
  BEFORE UPDATE ON mkt_social_accounts
  FOR EACH ROW EXECUTE FUNCTION mkt_update_updated_at();

CREATE TRIGGER set_updated_at_content_queue
  BEFORE UPDATE ON mkt_content_queue
  FOR EACH ROW EXECUTE FUNCTION mkt_update_updated_at();

CREATE TRIGGER set_updated_at_ab_tests
  BEFORE UPDATE ON mkt_ab_tests
  FOR EACH ROW EXECUTE FUNCTION mkt_update_updated_at();

CREATE TRIGGER set_updated_at_autopilot_config
  BEFORE UPDATE ON mkt_autopilot_config
  FOR EACH ROW EXECUTE FUNCTION mkt_update_updated_at();

CREATE TRIGGER set_updated_at_prompt_templates
  BEFORE UPDATE ON mkt_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION mkt_update_updated_at();
