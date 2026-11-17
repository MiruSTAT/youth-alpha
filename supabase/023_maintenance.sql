-- v37 (roadmap step 7): maintenance mode per program.
-- Safe to re-run. Deletes nothing.
--
-- * programs.maintenance (jsonb, default {}): { "on": true|false, "scene": "tree"|"bunny", "at": <when it was switched> }.
--   Everyone can read it (programs is public to read), so the app knows to show the maintenance scene.
-- * program_set_maintenance(p_id, p_on, p_scene): the super admin's switch (Programs page). The audit trigger on
--   programs (018) keeps every change in the admin log.
-- * in_maintenance(p): true while the program is in maintenance.
-- * Writes are blocked while it is on, for everyone except the super admin:
--   - can(p, perm) (021) is false for normal admins of that program, so every RLS rule and function built on it refuses;
--   - a BEFORE trigger (zz_maint_guard: "zz" so it runs after program_from_kid_trg has set program_id) on every program-owned table refuses inserts, updates and deletes from anyone
--     who is not the super admin (kids' feedback, the kids' activity log, member sign-ins, settings, …).
--   Not guarded on purpose: admin_presence ("who is online", the super admin's own pings) and audit_log (it is only
--   written by triggers on tables that are already guarded). Pictures in the storage bucket are not guarded here;
--   normal admins cannot reach the upload buttons while the scene is shown.

alter table public.programs add column if not exists maintenance jsonb not null default '{}'::jsonb;

create or replace function public.in_maintenance(p int) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (maintenance->>'on')::boolean from public.programs where id = p), false);
$$;
revoke all on function public.in_maintenance(int) from public;
grant execute on function public.in_maintenance(int) to anon, authenticated;

create or replace function public.program_set_maintenance(p_id int, p_on boolean, p_scene text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if coalesce(p_scene, 'tree') not in ('tree', 'bunny') then raise exception 'unknown scene'; end if;
  update public.programs
     set maintenance = jsonb_build_object('on', coalesce(p_on, false), 'scene', coalesce(p_scene, 'tree'), 'at', now())
   where id = p_id;
  if not found then raise exception 'no such program'; end if;
end; $$;
revoke all on function public.program_set_maintenance(int, boolean, text) from public, anon;
grant execute on function public.program_set_maintenance(int, boolean, text) to authenticated;

-- normal admins lose their permissions in a program while it is in maintenance (the super admin keeps everything)
create or replace function public.can(p int, perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or (not public.in_maintenance(p) and exists (
    select 1 from public.staff s join public.staff_programs sp on sp.user_id = s.user_id
    where s.user_id = auth.uid() and s.active and sp.program_id = p and perm = any(sp.perms)));
$$;

-- the write guard
create or replace function public.maint_guard() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare r jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end); p int;
begin
  p := case when tg_table_name = 'settings' then (r->>'id')::int else (r->>'program_id')::int end;
  if p is not null and public.in_maintenance(p) and not public.is_superadmin() then
    raise exception 'maintenance: program % is under maintenance', p using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

do $$
declare t text;
begin
  foreach t in array array['kids','point_categories','shop_items','songs','feedback','kid_events',
                           'attendance','attendance_rounds','points','redemptions','settings'] loop
    execute format('drop trigger if exists zz_maint_guard on public.%I', t);
    execute format('create trigger zz_maint_guard before insert or update or delete on public.%I for each row execute function public.maint_guard()', t);
  end loop;
  execute 'drop trigger if exists zz_maint_guard on private.members';
  execute 'create trigger zz_maint_guard before insert or update or delete on private.members for each row execute function public.maint_guard()';
end $$;
