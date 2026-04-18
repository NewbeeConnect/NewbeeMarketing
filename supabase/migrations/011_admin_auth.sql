-- Admin-only auth: replicate the Newbee `user_roles` + `get_my_roles()` pattern
-- used by admin.newbeeapp.com and expert.newbeeapp.com.
--
-- Marketing has its own Supabase project and cannot share the Newbee user_roles
-- table directly. Admins are seeded manually via Supabase dashboard or the
-- `grant_admin()` helper below.

-- 1. Role enum (minimal — just 'admin' and 'user', mirrors Newbee semantics)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mkt_app_role') THEN
    CREATE TYPE public.mkt_app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.mkt_app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles (needed for client-side role hook)
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only service_role can write (bypasses RLS anyway, but explicit for clarity).
-- No public INSERT/UPDATE/DELETE policy — forces admin seeding through service client.

-- 3. get_my_roles() — SECURITY DEFINER so the caller can read their own row
-- without needing a broader SELECT policy. Matches the Newbee signature.
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE (role text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role <> 'user';
$$;

REVOKE ALL ON FUNCTION public.get_my_roles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

-- 4. grant_admin() helper — callable only by service_role (API routes / dashboard).
-- Use from a server action or Supabase SQL editor:
--   SELECT public.grant_admin('user-uuid-here');
CREATE OR REPLACE FUNCTION public.grant_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service_role can grant admin';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_admin(UUID) FROM PUBLIC;
-- Intentionally no GRANT EXECUTE to authenticated — service_role only.
