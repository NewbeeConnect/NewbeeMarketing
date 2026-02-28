-- ============================================
-- 005: DB-backed rate limiting for serverless
-- Replaces in-memory token buckets that reset on cold starts
-- ============================================

CREATE TABLE public.mkt_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tokens NUMERIC(10, 2) NOT NULL DEFAULT 10,
    last_refill_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, category)
);

CREATE INDEX idx_mkt_rate_limits_user_category ON public.mkt_rate_limits(user_id, category);

ALTER TABLE public.mkt_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can access rate limits (not end users)
CREATE POLICY "Service role manages rate limits" ON public.mkt_rate_limits
FOR ALL USING (false) WITH CHECK (false);

-- Cleanup: remove stale entries older than 1 hour (optional cron)
COMMENT ON TABLE public.mkt_rate_limits IS 'DB-backed token bucket rate limiter for serverless environments';
