-- Drop legacy tables that belonged to the removed projects/campaigns/social/
-- twitter/autopilot/trend workflows. The app now uses only: user_roles,
-- mkt_stories, mkt_generations, mkt_usage_logs, mkt_rate_limits,
-- mkt_notifications, mkt_api_keys.

-- Drop cascade because these tables were interlinked (projects → scenes → generations, etc.)
-- and orphan rows in mkt_generations are already handled by nullable project_id from migration 012.

DROP TABLE IF EXISTS public.mkt_campaign_performance CASCADE;
DROP TABLE IF EXISTS public.mkt_ad_deployments CASCADE;
DROP TABLE IF EXISTS public.mkt_campaigns CASCADE;
DROP TABLE IF EXISTS public.mkt_ab_test_variants CASCADE;
DROP TABLE IF EXISTS public.mkt_ab_tests CASCADE;
DROP TABLE IF EXISTS public.mkt_social_post_metrics CASCADE;
DROP TABLE IF EXISTS public.mkt_content_queue CASCADE;
DROP TABLE IF EXISTS public.mkt_social_accounts CASCADE;
DROP TABLE IF EXISTS public.mkt_tweets CASCADE;
DROP TABLE IF EXISTS public.mkt_trends CASCADE;
DROP TABLE IF EXISTS public.mkt_prompt_templates CASCADE;
DROP TABLE IF EXISTS public.mkt_templates CASCADE;
DROP TABLE IF EXISTS public.mkt_code_contexts CASCADE;
DROP TABLE IF EXISTS public.mkt_autopilot_runs CASCADE;
DROP TABLE IF EXISTS public.mkt_autopilot_config CASCADE;
DROP TABLE IF EXISTS public.mkt_project_versions CASCADE;
DROP TABLE IF EXISTS public.mkt_captions CASCADE;
DROP TABLE IF EXISTS public.mkt_scenes CASCADE;
DROP TABLE IF EXISTS public.mkt_projects CASCADE;
DROP TABLE IF EXISTS public.mkt_brand_assets CASCADE;
DROP TABLE IF EXISTS public.mkt_brand_kit CASCADE;
DROP TABLE IF EXISTS public.mkt_calendar_events CASCADE;
