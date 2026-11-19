-- v39: admin activity in the kids' activity log is tagged, not mixed in with the kids. Safe to re-run.
-- * kid_events.by_staff (default false). Old rows stay as they are (false). Nothing is deleted.
-- * Trigger kid_events_staff_tag (BEFORE INSERT): the database decides by_staff itself from the sign-in
--   that sent the row (public.is_adult_account(): any admin or super admin account, also when the super admin's
--   2-step window has run out), so a phone can never fake it either way.
-- * mark_staff_device(device, program): called right after an admin signs in on a phone. Tags that phone's
--   rows from the last 10 minutes (e.g. "opened the app, went to the menu, then signed in"). Staff only.
--   It also takes those app opens back off the home visit counter.
-- * home_count_visit: app opens by staff do not count as visits.

alter table public.kid_events add column if not exists by_staff boolean not null default false;

-- signed in with an admin account (staff row) or the super admin account; members never use Supabase sign-in
create or replace function public.is_adult_account() returns boolean
language sql stable security definer set search_path = public, private as $$
  select auth.uid() is not null and (exists (select 1 from public.staff s where s.user_id = auth.uid())
    or exists (select 1 from private.super_admins a where a.user_id = auth.uid()));
$$;
revoke all on function public.is_adult_account() from public, anon;
grant execute on function public.is_adult_account() to authenticated;

create or replace function public.kid_events_staff_tag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.by_staff := coalesce(public.is_adult_account(), false);
  return new;
end $$;
drop trigger if exists kid_events_staff_tag on public.kid_events;
create trigger kid_events_staff_tag before insert on public.kid_events for each row execute function public.kid_events_staff_tag();

create or replace function public.home_count_visit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.event = 'open_app' and not new.by_staff then
    insert into public.home_counters as h (program_id, visits) values (new.program_id, 1)
    on conflict (program_id) do update set visits = h.visits + 1, updated_at = now();
  end if;
  return new;
end $$;

create or replace function public.mark_staff_device(p_device text, p_program int default 1) returns int
language plpgsql security definer set search_path = public as $$
declare n int; opens int;
begin
  if not public.is_adult_account() then raise exception 'staff only'; end if;
  with u as (
    update public.kid_events set by_staff = true
    where device_id = p_device and program_id = p_program and not by_staff and created_at > now() - interval '10 minutes'
    returning event)
  select count(*), count(*) filter (where event = 'open_app') into n, opens from u;
  if opens > 0 then
    update public.home_counters set visits = greatest(0, visits - opens), updated_at = now() where program_id = p_program;
  end if;
  return n;
end $$;
revoke all on function public.mark_staff_device(text, int) from public, anon;
grant execute on function public.mark_staff_device(text, int) to authenticated;

-- weekly summary counts (phones, most opened songs) leave out admin activity
create or replace function public.kid_week_stats(p_program int, p_since timestamptz) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.in_program(p_program) then raise exception 'no access to this program'; end if;
  return json_build_object(
    'phones', (select count(distinct device_id) from public.kid_events where program_id = p_program and created_at >= p_since and not by_staff),
    'songs', coalesce((select json_agg(x order by x.n desc) from (
       select detail as title, count(*) as n, count(distinct device_id) as devices from public.kid_events
       where program_id = p_program and created_at >= p_since and event = 'song_open' and detail <> '' and not by_staff
       group by detail order by count(*) desc limit 5) x), '[]'::json));
end; $$;
revoke all on function public.kid_week_stats(int, timestamptz) from public, anon;
grant execute on function public.kid_week_stats(int, timestamptz) to authenticated;
