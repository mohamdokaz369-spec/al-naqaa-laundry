-- ============================================================================
-- Run this BEFORE applying 0001_auth_roles_and_rls.sql, and AGAIN AFTER.
-- Read-only — it changes nothing. Paste into the Supabase Dashboard SQL
-- Editor, or `supabase db execute` / `psql` against the project.
--
-- Why this matters: 0001_auth_roles_and_rls.sql only does
-- `drop policy if exists "<name>"` for the exact policy names IT creates.
-- If this project already has some OTHER policy on these tables — e.g. a
-- permissive "Enable read access for all users" created earlier from the
-- Supabase Table Editor UI, or anything else with a different name — the
-- migration will NOT know about it, will NOT drop it, and that old policy
-- keeps applying alongside the new ones (Postgres combines multiple
-- permissive policies for the same command with OR). In that case anon
-- could still read/write these tables even after the migration runs. Do
-- not conclude "anon is blocked" from the migration alone — confirm with
-- the query below.
-- ============================================================================

-- 1) Every existing policy on the four tables this migration touches.
--    After applying 0001_auth_roles_and_rls.sql, this should list ONLY the
--    11 policy names the migration creates (see the `known_policy_names`
--    list in query 2 below). Any other name here is a legacy policy you
--    must review by hand and decide whether to drop.
select
  schemaname,
  tablename,
  policyname,
  permissive,   -- 'PERMISSIVE' policies are OR-combined; a stray
                -- permissive "allow all" policy defeats everything else.
  roles,
  cmd,          -- SELECT / INSERT / UPDATE / DELETE / ALL
  qual,         -- the USING expression
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'drivers', 'order_status_history', 'profiles')
order by tablename, policyname;

-- 2) Flags any policy NOT created by 0001_auth_roles_and_rls.sql — these
--    are the ones to investigate. An empty result here (zero rows) is
--    what "RLS actually blocks anon" depends on.
select
  tablename,
  policyname,
  'UNKNOWN POLICY — review before trusting RLS to block anon' as warning
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'drivers', 'order_status_history', 'profiles')
  and policyname not in (
    -- orders
    'orders_admin_all', 'orders_driver_select_own', 'orders_driver_update_own',
    -- drivers
    'drivers_admin_all', 'drivers_self_select', 'drivers_self_update',
    -- order_status_history
    'history_admin_select', 'history_driver_select_own',
    -- profiles
    'profiles_select_own', 'profiles_admin_all'
  );

-- 3) Confirms RLS is actually ENABLED on each table (a policy existing
--    doesn't matter if row security was never switched on for the table).
select
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced_for_owner
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('orders', 'drivers', 'order_status_history', 'profiles');

-- 4) If query 2 returned any row, this generates (but does NOT run) the
--    DROP statement for each unknown policy so you can review and paste
--    the ones you've confirmed are safe to remove. Never run DROP
--    statements you haven't personally reviewed against a table holding
--    real customer data.
select
  format('drop policy %I on %I.%I;', policyname, schemaname, tablename) as review_then_run_manually
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'drivers', 'order_status_history', 'profiles')
  and policyname not in (
    'orders_admin_all', 'orders_driver_select_own', 'orders_driver_update_own',
    'drivers_admin_all', 'drivers_self_select', 'drivers_self_update',
    'history_admin_select', 'history_driver_select_own',
    'profiles_select_own', 'profiles_admin_all'
  );
