-- Newbee Marketing Hub - Ad Distribution & Performance Schema
-- Migration 002: Adds ad deployment, performance tracking, and API key storage

-- ============================================
-- 1. ALTER EXISTING TABLES
-- ============================================

-- Add source_url to projects (for context fetching)
ALTER TABLE public.mkt_projects ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add ad_platforms to campaigns
ALTER TABLE public.mkt_campaigns ADD COLUMN IF NOT EXISTS ad_platforms TEXT[];

-- ============================================
-- 2. API KEYS (per-user ad platform credentials)
-- ============================================
CREATE TABLE public.mkt_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
    keys_encrypted JSONB NOT NULL,
    is_valid BOOLEAN DEFAULT false,
    last_validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, platform)
);

CREATE INDEX idx_mkt_api_keys_user ON public.mkt_api_keys(user_id);

ALTER TABLE public.mkt_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own API keys" ON public.mkt_api_keys FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 3. AD DEPLOYMENTS
-- ============================================
CREATE TABLE public.mkt_ad_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.mkt_campaigns(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES public.mkt_projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('google', 'meta')),
    external_campaign_id TEXT,
    external_ad_id TEXT,
    creative_urls TEXT[] NOT NULL,
    budget_daily_usd DECIMAL(10,2),
    budget_total_usd DECIMAL(10,2),
    targeting JSONB,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'active', 'paused', 'completed', 'rejected'
    )),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_ad_deployments_user ON public.mkt_ad_deployments(user_id);
CREATE INDEX idx_mkt_ad_deployments_campaign ON public.mkt_ad_deployments(campaign_id);
CREATE INDEX idx_mkt_ad_deployments_project ON public.mkt_ad_deployments(project_id);
CREATE INDEX idx_mkt_ad_deployments_status ON public.mkt_ad_deployments(status);

ALTER TABLE public.mkt_ad_deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad deployments" ON public.mkt_ad_deployments FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. CAMPAIGN PERFORMANCE
-- ============================================
CREATE TABLE public.mkt_campaign_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.mkt_campaigns(id) ON DELETE CASCADE,
    deployment_id UUID REFERENCES public.mkt_ad_deployments(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.mkt_projects(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    spend_usd DECIMAL(10,2) DEFAULT 0,
    version_type TEXT CHECK (version_type IN ('emotional', 'technical', 'single')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(deployment_id, date)
);

CREATE INDEX idx_mkt_performance_user ON public.mkt_campaign_performance(user_id);
CREATE INDEX idx_mkt_performance_campaign ON public.mkt_campaign_performance(campaign_id);
CREATE INDEX idx_mkt_performance_deployment ON public.mkt_campaign_performance(deployment_id);
CREATE INDEX idx_mkt_performance_date ON public.mkt_campaign_performance(date);

ALTER TABLE public.mkt_campaign_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own performance data" ON public.mkt_campaign_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts performance data" ON public.mkt_campaign_performance FOR INSERT WITH CHECK (true);

-- ============================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_mkt_api_keys_updated_at BEFORE UPDATE ON public.mkt_api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mkt_ad_deployments_updated_at BEFORE UPDATE ON public.mkt_ad_deployments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
