-- v36 (roadmap step 6): visits and feedback counters on the kids' home page.
-- Safe to re-run. Deletes nothing.
--
-- * home_counters: one row per program with a visit counter. +1 for every "open_app" row written to kid_events
--   (trigger below). It is kept apart from kid_events so "Clear kids' activity log" (clear_kid_events) does not
--   reset it, and apart from settings so the admin log is not filled with one row per app open.
--   Nobody reads or writes the table directly (RLS on, no policies); only the functions below touch it.
-- * settings.show_visits / settings.show_fb_count: on/off switches per program (default off). The settings guard
--   trigger (021) already sends unknown columns to the 'settings' permission, and the audit trigger logs changes.
-- * event_info gets the two switches (kids read them there).
-- * home_counts(p): numbers for the kids' home page, only for a switch that is on (null otherwise).
--   Feedback = count of the program's feedback rows (feedback can never be deleted).

create table if not exists public.home_counters (
  program_id int primary key references public.programs(id),
  visits bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.home_counters enable row level security;
revoke all on public.home_counters from anon, authenticated;

-- start from the app opens already in the activity log (only for programs that have no row yet, so a re-run never counts twice)
insert into public.home_counters (program_id, visits)
select program_id, count(*) from public.kid_events where event = 'open_app' group by program_id
on conflict (program_id) do nothing;

create or replace function public.home_count_visit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.event = 'open_app' then
    insert into public.home_counters as h (program_id, visits) values (new.program_id, 1)
    on conflict (program_id) do update set visits = h.visits + 1, updated_at = now();
  end if;
  return new;
end $$;
drop trigger if exists home_count_visit on public.kid_events;
create trigger home_count_visit after insert on public.kid_events for each row execute function public.home_count_visit();

alter table public.settings add column if not exists show_visits boolean not null default false;
alter table public.settings add column if not exists show_fb_count boolean not null default false;

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music,
       announce, verse_text, verse_ref, install_on, id as program_id, show_visits, show_fb_count
from public.settings;
grant select on public.event_info to anon, authenticated;

create or replace function public.home_counts(p int) returns table (visits bigint, feedback bigint)
language sql stable security definer set search_path = public as $$
  select case when s.show_visits then coalesce((select h.visits from public.home_counters h where h.program_id = p), 0) end,
         case when s.show_fb_count then (select count(*) from public.feedback f where f.program_id = p) end
  from public.settings s where s.id = p;
$$;
revoke all on function public.home_counts(int) from public;
grant execute on function public.home_counts(int) to anon, authenticated;
