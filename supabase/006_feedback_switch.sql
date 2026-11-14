-- =====================================================================
-- Youth Alpha — update 6: feedback is opened/closed by an admin switch (no timer). Safe to re-run.
-- =====================================================================
alter table public.settings add column if not exists fb_open boolean not null default false;

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;

create or replace function public.feedback_open() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select fb_open from public.settings where id = 1), false);
$$;
