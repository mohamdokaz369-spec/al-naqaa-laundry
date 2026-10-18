-- ============================================================================
-- Al Naqaa Laundry — Auth roles + Row Level Security
-- ============================================================================
-- This migration is the real authorization boundary for the app. Before it,
-- the admin/driver dashboards were "protected" only by a client-side
-- password check and a localStorage flag — trivially bypassable, and
-- meaningless anyway because the Supabase anon key (shipped to every
-- browser) could read/write the orders/drivers tables directly regardless
-- of what the UI did.
--
-- After this migration:
--   - every signed-in user has exactly one row in public.profiles saying
--     whether they are an 'admin' or a 'driver' (and which drivers row a
--     driver maps to).
--   - RLS is enabled on profiles / orders / drivers / order_status_history.
--   - admins can do anything to orders/drivers/order_status_history.
--   - drivers can only see/update orders assigned to them, see their own
--     driver row, and see/insert status-history rows for their own orders
--     — AND, on top of row-level access, two triggers restrict *which
--     columns* and *which status transitions* a driver (not an admin, and
--     not the server's own service-role writes) may actually write (see
--     sections 6 and 7). Without those triggers, RLS alone would let a
--     driver UPDATE any column on their own driver row (including
--     is_active, name, phone) or any column on their assigned orders
--     (including customer_name, phone, address) — RLS is row-level only,
--     not column-level. Both triggers use an ALLOW-list of columns (not a
--     deny-list), and both exempt `auth.uid() is null` (the service-role
--     key used by app/api/orders and app/api/track, which has no end-user
--     JWT at all) so the server's own writes — e.g. setting order_number
--     right after insert — are never blocked by a rule meant for drivers.
--   - disabling a driver (`drivers.is_active = false`) immediately revokes
--     their RLS access too, not just the app's login check — see
--     current_driver_id() in section 2.
--   - anon (unauthenticated) has NO policy on orders/drivers/history at
--     all, so RLS default-denies it — PROVIDED no older, differently-named
--     permissive policy already exists on these tables from before this
--     migration. This migration only drops policies by the exact names it
--     creates; it cannot know about and will not touch policies it didn't
--     create. **Run supabase/check_existing_policies.sql BEFORE and AFTER
--     applying this file** — see supabase/README.md section 0 and the
--     "after apply" checklist. Do not treat anon as blocked until that
--     check comes back clean.
--
-- HOW TO APPLY (see supabase/README.md for the full checklist):
--   supabase link --project-ref <your-project-ref>
--   supabase db push
-- or paste this file into the Supabase Dashboard -> SQL Editor and run it.
--
-- This file only changes schema/policies/triggers. It does NOT touch
-- existing rows, and does NOT drop any policy it didn't itself create.
-- ============================================================================

-- ─── 1) profiles ─────────────────────────────────────────────────────────────
-- One row per auth.users account, holding the app role and (for drivers)
-- the link to the existing `drivers` table.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'driver')),
  driver_id bigint references public.drivers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'App role (admin/driver) per Supabase Auth user, created manually by an admin — see supabase/README.md.';

-- ─── 2) helper functions ───────────────────────────────────────────────────
-- Defined BEFORE any policy uses them, and as `security definer` so they
-- read public.profiles/public.drivers bypassing RLS internally. This is
-- required, not just tidy: a policy on `profiles` that checked admin-ness
-- via a plain subquery on `profiles` itself would re-trigger RLS on that
-- same subquery, which is the classic Postgres/Supabase "infinite
-- recursion detected in policy for relation profiles" footgun. Routing
-- every admin/driver check through these functions avoids it everywhere.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Returns the caller's driver_id ONLY while they are a driver AND that
-- driver row is currently active. The moment an admin sets
-- `drivers.is_active = false`, this starts returning NULL for that
-- user, which makes every RLS policy below that compares against
-- current_driver_id() stop matching any row — access is revoked at the
-- database level immediately, not just at the next login/app check.
create or replace function public.current_driver_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select p.driver_id
  from public.profiles p
  join public.drivers d on d.id = p.driver_id
  where p.id = auth.uid()
    and p.role = 'driver'
    and d.is_active = true;
$$;

-- ─── 3) profiles RLS ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- A signed-in user may read their own profile (the app needs this to know
-- which dashboard to show and, for drivers, their driver_id).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

-- Only admins may create/modify/delete profiles (i.e. only an admin can
-- promote someone to admin or link a driver's login to a drivers row).
-- Uses is_admin() rather than an inline subquery on profiles — see the
-- comment on that function above for why.
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 4) orders ───────────────────────────────────────────────────────────────
alter table public.orders enable row level security;

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_driver_select_own" on public.orders;
create policy "orders_driver_select_own"
  on public.orders for select
  using (assigned_driver_id = public.current_driver_id());

-- Row-level only: this lets a driver UPDATE their own assigned order, but
-- says nothing about which COLUMNS they may change. The trigger in
-- section 6 is what actually restricts them to `status` (within an
-- allowed transition) and `updated_at`.
drop policy if exists "orders_driver_update_own" on public.orders;
create policy "orders_driver_update_own"
  on public.orders for update
  using (assigned_driver_id = public.current_driver_id())
  with check (assigned_driver_id = public.current_driver_id());

-- No insert/delete policy for drivers (matches current app behavior — only
-- the admin creates/deletes orders) and NO policy at all for anon/public:
-- RLS default-denies direct access, UNLESS an older permissive policy
-- survives from before this migration — see the note at the top of this
-- file and supabase/check_existing_policies.sql. Customer-facing
-- create/track goes through the service-role API routes instead.

-- ─── 5) drivers ──────────────────────────────────────────────────────────────
alter table public.drivers enable row level security;

drop policy if exists "drivers_admin_all" on public.drivers;
create policy "drivers_admin_all"
  on public.drivers for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "drivers_self_select" on public.drivers;
create policy "drivers_self_select"
  on public.drivers for select
  using (id = public.current_driver_id());

-- Row-level only, same caveat as orders_driver_update_own above: this
-- lets an active driver UPDATE their own row, but the trigger in section
-- 7 is what actually restricts them to the live-location columns and
-- blocks changes to name/phone/is_active.
drop policy if exists "drivers_self_update" on public.drivers;
create policy "drivers_self_update"
  on public.drivers for update
  using (id = public.current_driver_id())
  with check (id = public.current_driver_id());

-- ─── 6) column + transition guard: orders ──────────────────────────────────
-- RLS is row-level: orders_driver_update_own above only says WHICH ROW a
-- driver may target, not which columns. Without this trigger, a driver
-- could legally UPDATE customer_name, phone, address, assigned_driver_id,
-- etc. on their own assigned order, or set `status` to anything at all.
--
-- This is an ALLOW-list, not a deny-list: `allowed_keys` names the only
-- columns a driver may change (`status`, `updated_at`); everything else
-- is compared via `to_jsonb(...) - allowed_keys` and rejected if
-- different. A deny-list enumerating every other column would silently
-- stop protecting any column added to `orders` later unless someone
-- remembered to update this trigger too — the allow-list has no such gap.
--
-- `status` may additionally only move along the exact transitions
-- app/driver/page.tsx exposes (see lib/types.ts DRIVER_STATUS_ACTIONS —
-- keep these in sync).
--
-- Bypass: `auth.uid() is null` is true exactly when the caller is using
-- the service-role key (app/api/orders, app/api/track — e.g. setting
-- order_number right after insert) — there is no end-user JWT at all in
-- that case, as opposed to an authenticated admin or driver session which
-- always has a non-null auth.uid(). Service-role already bypasses RLS
-- entirely (it can reach ANY row, unlike anon which has no matching
-- UPDATE policy on `orders` and so never reaches this trigger at all) —
-- this bypass just extends that same existing trust to the trigger layer
-- instead of accidentally blocking the server's own writes.
create or replace function public.enforce_driver_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_keys text[] := array['status', 'updated_at'];
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if (to_jsonb(old) - allowed_keys) is distinct from (to_jsonb(new) - allowed_keys) then
    raise exception 'السائق مسموح له فقط بتحديث حالة الطلب (status)، لا بقية بيانات الطلب أو العميل';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'assigned'   and new.status in ('on_the_way', 'cancelled')) or
      (old.status = 'on_the_way' and new.status in ('arrived', 'cancelled')) or
      (old.status = 'arrived'    and new.status in ('picked_up', 'cancelled')) or
      (old.status = 'delivering' and new.status = 'completed')
    ) then
      raise exception 'انتقال حالة غير مصرح به للسائق: % → %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_driver_update on public.orders;
create trigger orders_enforce_driver_update
  before update on public.orders
  for each row execute function public.enforce_driver_order_update();

-- ─── 7) column guard: drivers ──────────────────────────────────────────────
-- Same reasoning as section 6, for the drivers table: drivers_self_update
-- only restricts WHICH ROW, not which columns. Allow-list again (not a
-- deny-list of name/phone/is_active) — the only columns
-- app/driver/page.tsx's geolocation watcher ever writes are
-- current_lat/current_lng/last_location_update, so that's the complete
-- allowed set; everything else on `drivers` (name, phone, is_active, and
-- any column added later) is rejected by default, not just the three
-- fields someone remembered to name explicitly.
--
-- Same service-role bypass rationale as section 6's trigger.
create or replace function public.enforce_driver_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_keys text[] := array['current_lat', 'current_lng', 'last_location_update'];
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if (to_jsonb(old) - allowed_keys) is distinct from (to_jsonb(new) - allowed_keys) then
    raise exception 'السائق مسموح له فقط بتحديث موقعه الحي، لا بياناته الشخصية أو حالة تفعيله';
  end if;

  return new;
end;
$$;

drop trigger if exists drivers_enforce_self_update on public.drivers;
create trigger drivers_enforce_self_update
  before update on public.drivers
  for each row execute function public.enforce_driver_self_update();

-- ─── 8) order_status_history ──────────────────────────────────────────────────
alter table public.order_status_history enable row level security;

drop policy if exists "history_admin_all" on public.order_status_history;
create policy "history_admin_all"
  on public.order_status_history for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "history_driver_select_own" on public.order_status_history;
create policy "history_driver_select_own"
  on public.order_status_history for select
  using (
    order_id in (select id from public.orders where assigned_driver_id = public.current_driver_id())
  );

drop policy if exists "history_driver_insert_own" on public.order_status_history;
create policy "history_driver_insert_own"
  on public.order_status_history for insert
  with check (
    order_id in (select id from public.orders where assigned_driver_id = public.current_driver_id())
  );

-- ─── 9) keep profiles.updated_at fresh ─────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
