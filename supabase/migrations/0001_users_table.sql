-- 0001_users_table.sql
-- Phase 0: users profile table linked 1:1 to auth.users.
--
-- Per §3 (Data Model): users — id, email, full_name, role (admin/teacher/bursar).
-- Per §2 (Roles & Access Control): role separation enforced via RLS.
-- Per §9 (Security Notes): RLS is the actual security boundary, not key secrecy.
--
-- This is the ONLY schema object created in Phase 0. All other §3 tables
-- arrive in Phase 1 (0002_*) onward. Phase 0's "Done when" — "a user can
-- log in and land on a role-specific empty dashboard" — requires knowing
-- the logged-in user's role, which lives in this table.
--
-- Approval context: judgment call flagged and approved before Phase 0
-- began — see worklog.md Phase 0 entry.

BEGIN;

-- ============================================================================
-- 1. public.users table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'bursar')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS
  'User profile with role. Linked 1:1 to auth.users. The role column is '
  'the single source of truth for role-based access (§2, §3).';

COMMENT ON COLUMN public.users.id IS
  'FK to auth.users.id. Same value as the auth user id; ON DELETE CASCADE '
  'so deleting the auth user removes the profile.';

COMMENT ON COLUMN public.users.role IS
  'admin | teacher | bursar. Enforced via CHECK constraint. RLS policies '
  'on every other table (Phase 1+) consult this column for role-based access.';

-- ============================================================================
-- 2. updated_at maintenance trigger (shared, reusable function)
-- ============================================================================
-- Defined here in Phase 0 because every subsequent table will need it.
-- Other migrations can reference public.set_updated_at() without redefining.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. Row-Level Security
-- ============================================================================
-- Per §2 and §9: enforce role separation at the database, not just UI.
--
-- Phase 0 policies on public.users:
--   - A user can always READ their own row (needed for the frontend to
--     know its own role and drive the dashboard redirect).
--   - Admins can READ all rows (needed for the Phase 1 "Create User" admin
--     action and the admin user-management screen).
--   - No INSERT/UPDATE/DELETE via the anon/authenticated role here in
--     Phase 0. User provisioning is an admin action arriving in Phase 1
--     via a SECURITY DEFINER function (which will own the inserts into
--     both auth.users and public.users). For Phase 0, the seed script
--     inserts test users by running as the postgres superuser in the
--     Supabase SQL editor — bypassing RLS by design for dev seed only.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Select own row
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all rows
DROP POLICY IF EXISTS users_select_admin ON public.users;
CREATE POLICY users_select_admin
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

COMMIT;

-- ============================================================================
-- End of migration 0001
-- ============================================================================
