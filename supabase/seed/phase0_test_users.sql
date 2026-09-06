-- ============================================================================
-- seed/phase0_test_users.sql
-- ============================================================================
-- DEV-ONLY seed for Phase 0 verification. Creates 3 auth.users + 3 matching
-- public.users rows so the role-based dashboard redirect can be tested.
--
-- >>> Run this in the Supabase SQL editor of the DEV project only. <<<
-- It inserts directly into auth.users, which requires superuser privileges
-- and bypasses RLS by design — exactly what we want for a dev seed.
-- NEVER run this against the prod project. Prod user provisioning arrives
-- in Phase 1 as an admin-owned SECURITY DEFINER function (no raw SQL).
--
-- Test credentials (after running this):
--   admin@example.com   / Password123!   (role: admin)
--   teacher@example.com / Password123!   (role: teacher)
--   bursar@example.com  / Password123!   (role: bursar)
--
-- Prerequisite: 0001_users_table.sql must already be applied.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Helper CTE: fetch the live instance_id from auth.instances so the seed
-- works regardless of how Supabase provisioned this project.
-- ----------------------------------------------------------------------------
WITH instance AS (
  SELECT id AS instance_id FROM auth.instances ORDER BY created_at DESC LIMIT 1
),
new_users AS (
  SELECT
    gen_random_uuid() AS id,
    (SELECT instance_id FROM instance) AS instance_id,
    email,
    pwd,
    full_name,
    role_label
  FROM (VALUES
    ('admin@example.com',   'Password123!', 'Phase 0 Admin User',   'admin'),
    ('teacher@example.com', 'Password123!', 'Phase 0 Teacher User', 'teacher'),
    ('bursar@example.com',  'Password123!', 'Phase 0 Bursar User',  'bursar')
  ) AS t(email, pwd, full_name, role_label)
)

-- 1) Insert into auth.users (with bf-10 hashed password so Supabase Auth
--    accepts the login immediately). ON CONFLICT (email) DO NOTHING so the
--    script is idempotent across re-runs.
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  role,
  aud,
  banned_until,
  constraints
)
SELECT
  nu.id,
  nu.instance_id,
  nu.email,
  crypt(nu.pwd, gen_salt('bf', 10)),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  NULL,
  '[]'::jsonb
FROM new_users nu
ON CONFLICT (email) DO NOTHING;

-- 2) Insert matching public.users profile rows. Look up the auth.users.id
--    by email so this works whether the auth row was just inserted or
--    already existed from a prior run.
INSERT INTO public.users (id, email, full_name, role)
SELECT
  au.id,
  au.email,
  CASE au.email
    WHEN 'admin@example.com'   THEN 'Phase 0 Admin User'
    WHEN 'teacher@example.com' THEN 'Phase 0 Teacher User'
    WHEN 'bursar@example.com'  THEN 'Phase 0 Bursar User'
  END,
  CASE au.email
    WHEN 'admin@example.com'   THEN 'admin'
    WHEN 'teacher@example.com' THEN 'teacher'
    WHEN 'bursar@example.com'  THEN 'bursar'
  END
FROM auth.users au
WHERE au.email IN ('admin@example.com', 'teacher@example.com', 'bursar@example.com')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Verify (run separately in the SQL editor to confirm):
--   SELECT id, email, full_name, role FROM public.users ORDER BY role;
-- ============================================================================

-- ============================================================================
-- To tear down (dev only, before re-running):
--   DELETE FROM public.users WHERE email IN (
--     'admin@example.com', 'teacher@example.com', 'bursar@example.com'
--   );
--   DELETE FROM auth.users WHERE email IN (
--     'admin@example.com', 'teacher@example.com', 'bursar@example.com'
--   );
-- ============================================================================
