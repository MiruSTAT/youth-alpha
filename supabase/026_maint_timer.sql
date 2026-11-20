-- v46: a timer for maintenance mode (set by the super admin when switching it on).
-- Safe to re-run. Deletes nothing.
--
-- * programs.maintenance gets an optional "until" (timestamptz as text): { "on": true, "scene": "tree", "at": ..., "until": ... }.
--   No "until" (or null) = no timer, maintenance stays on until the super admin ends it (same as v37).
-- * in_maintenance(p) is now false once "until" has passed, so the write guard (maint_guard) and can() (023) let
--   everyone back in at that moment by themselves; nobody has to switch it off. The row keeps "on": true until the
--   super admin switches it off or on again (the app also treats a passed "until" as off).
-- * program_set_maintenance(p_id, p_on, p_scene, p_minutes): new 4-argument form. p_minutes null or 0 = no timer,
--   otherwise 1..10080 (one week). The old 3-argument form (used by app versions before v46) stays and means "no timer".

create or replace function public.in_maintenance(p int) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (maintenance->>'on')::boolean
                          and (maintenance->>'until' is null or (maintenance->>'until')::timestamptz > now())
                     from public.programs where id = p), false);
$$;
revoke all on function public.in_maintenance(int) from public;
grant execute on function public.in_maintenance(int) to anon, authenticated;

create or replace function public.program_set_maintenance(p_id int, p_on boolean, p_scene text, p_minutes int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if coalesce(p_scene, 'tree') not in ('tree', 'bunny') then raise exception 'unknown scene'; end if;
  if p_minutes is not null and (p_minutes < 0 or p_minutes > 10080) then raise exception 'timer must be 0 to 10080 minutes'; end if;
  update public.programs
     set maintenance = jsonb_build_object('on', coalesce(p_on, false), 'scene', coalesce(p_scene, 'tree'), 'at', now(),
                                          'until', case when coalesce(p_on, false) and coalesce(p_minutes, 0) > 0
                                                        then now() + make_interval(mins => p_minutes) end)
   where id = p_id;
  if not found then raise exception 'no such program'; end if;
end; $$;
revoke all on function public.program_set_maintenance(int, boolean, text, int) from public, anon;
grant execute on function public.program_set_maintenance(int, boolean, text, int) to authenticated;

-- the old form keeps working (no timer)
create or replace function public.program_set_maintenance(p_id int, p_on boolean, p_scene text) returns void
language sql security definer set search_path = public as $$
  select public.program_set_maintenance(p_id, p_on, p_scene, null::int);
$$;
revoke all on function public.program_set_maintenance(int, boolean, text) from public, anon;
grant execute on function public.program_set_maintenance(int, boolean, text) to authenticated;
