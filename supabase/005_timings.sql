-- =====================================================================
-- Youth Alpha — update 5: adjustable feedback window + tip frequency. Safe to re-run.
-- =====================================================================
alter table public.settings add column if not exists fb_dow   int  not null default 0 check (fb_dow between 0 and 6);
alter table public.settings add column if not exists fb_start text not null default '12:00' check (fb_start ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.settings add column if not exists fb_end   text not null default '23:59' check (fb_end ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.settings add column if not exists tip_days int  not null default 3 check (tip_days between 0 and 60);

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;

-- feedback is open on the feedback day between fb_start and fb_end (Thai time)
create or replace function public.feedback_open() returns boolean
language sql stable security definer set search_path = public as $$
  select extract(dow from (now() at time zone 'Asia/Bangkok'))::int = s.fb_dow
     and to_char(now() at time zone 'Asia/Bangkok', 'HH24:MI') between s.fb_start and s.fb_end
  from public.settings s where s.id = 1;
$$;
