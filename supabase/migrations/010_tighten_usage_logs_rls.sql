-- Tighten mkt_usage_logs INSERT policy
--
-- Before: WITH CHECK (true) — any role can insert (anon, authenticated, service).
-- After: only service_role can insert — API routes already use createServiceClient()
-- so this is a no-op for correct code paths and closes a potential cost-tracking
-- tampering vector (monthly budget cap relies on this table).

DROP POLICY IF EXISTS "Service role inserts usage logs" ON public.mkt_usage_logs;

CREATE POLICY "Service role inserts usage logs"
  ON public.mkt_usage_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
