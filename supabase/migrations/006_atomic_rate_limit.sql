-- ============================================
-- 006: Atomic rate limit check-and-consume function
-- Fixes race condition in read-then-write token bucket
-- ============================================

CREATE OR REPLACE FUNCTION public.mkt_check_rate_limit(
    p_user_id UUID,
    p_category TEXT,
    p_max_tokens NUMERIC,
    p_refill_rate NUMERIC  -- tokens per second
)
RETURNS TABLE(allowed BOOLEAN, remaining_tokens NUMERIC, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tokens NUMERIC;
    v_last_refill TIMESTAMPTZ;
    v_elapsed NUMERIC;
    v_refilled NUMERIC;
    v_wait INTEGER;
BEGIN
    -- Attempt to lock the row for this user+category
    SELECT rl.tokens, rl.last_refill_at
    INTO v_tokens, v_last_refill
    FROM public.mkt_rate_limits rl
    WHERE rl.user_id = p_user_id AND rl.category = p_category
    FOR UPDATE;

    IF NOT FOUND THEN
        -- First request: create bucket with max_tokens - 1
        INSERT INTO public.mkt_rate_limits (user_id, category, tokens, last_refill_at)
        VALUES (p_user_id, p_category, p_max_tokens - 1, now())
        ON CONFLICT (user_id, category) DO UPDATE
            SET tokens = LEAST(p_max_tokens, mkt_rate_limits.tokens +
                EXTRACT(EPOCH FROM (now() - mkt_rate_limits.last_refill_at)) * p_refill_rate) - 1,
                last_refill_at = now();

        RETURN QUERY SELECT true, p_max_tokens - 1, 0;
        RETURN;
    END IF;

    -- Calculate refilled tokens
    v_elapsed := EXTRACT(EPOCH FROM (now() - v_last_refill));
    v_refilled := LEAST(p_max_tokens, v_tokens + v_elapsed * p_refill_rate);

    IF v_refilled < 1 THEN
        -- Not enough tokens
        v_wait := CEIL((1 - v_refilled) / p_refill_rate);
        RETURN QUERY SELECT false, v_refilled, v_wait;
        RETURN;
    END IF;

    -- Consume one token atomically
    UPDATE public.mkt_rate_limits
    SET tokens = v_refilled - 1,
        last_refill_at = now()
    WHERE user_id = p_user_id AND category = p_category;

    RETURN QUERY SELECT true, v_refilled - 1, 0;
END;
$$;

COMMENT ON FUNCTION public.mkt_check_rate_limit IS 'Atomic token bucket rate limit check: refill + consume in one transaction with row-level locking';
