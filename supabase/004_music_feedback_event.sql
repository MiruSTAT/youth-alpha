-- =====================================================================
-- Youth Alpha — update 4: one "Music" category with details, kids' feedback,
-- event day/time (default every Sunday 10:00–12:00, Thai time). Safe to re-run.
-- =====================================================================

-- ---------- Details inside a category (e.g. Music: piano / singing / practice)
alter table public.points           add column if not exists detail  text not null default '';
alter table public.point_categories add column if not exists details text not null default '';

insert into public.point_categories (key, name_th, name_en, icon, info, details, sort)
values ('music', 'ดนตรี', 'Music', '🎵', '', 'เปียโน' || chr(10) || 'ร้องเพลง' || chr(10) || 'ซ้อมดนตรี', 1)
on conflict (key) do nothing;

-- move existing piano / singing / practice points into Music, keeping which one it was
update public.points
set detail = case skill when 'piano' then 'เปียโน' when 'singing' then 'ร้องเพลง' else 'ซ้อมดนตรี' end,
    skill  = 'music'
where skill in ('piano', 'singing', 'practice');
delete from public.point_categories where key in ('piano', 'singing', 'practice');

-- per kid / category / detail totals (public: points only)
drop view if exists public.kid_skill_totals;
create view public.kid_skill_totals as
select p.kid_id, p.skill, p.detail, sum(p.amount)::int as total
from public.points p join public.kids k on k.id = p.kid_id and k.active
group by p.kid_id, p.skill, p.detail;
grant select on public.kid_skill_totals to anon, authenticated;

-- ---------- Event day / time (0 = Sunday)
alter table public.settings add column if not exists event_dow   int  not null default 0 check (event_dow between 0 and 6);
alter table public.settings add column if not exists event_start text not null default '10:00' check (event_start ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.settings add column if not exists event_end   text not null default '12:00' check (event_end ~ '^[0-2][0-9]:[0-5][0-9]$');

create or replace view public.event_info as
select event_dow, event_start, event_end from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;

-- feedback is open on the event day, from the end time until midnight (Thai time)
create or replace function public.feedback_open() returns boolean
language sql stable security definer set search_path = public as $$
  select extract(dow from (now() at time zone 'Asia/Bangkok'))::int = s.event_dow
     and to_char(now() at time zone 'Asia/Bangkok', 'HH24:MI') >= s.event_end
  from public.settings s where s.id = 1;
$$;
grant execute on function public.feedback_open() to anon, authenticated;

-- ---------- Kids' feedback (kids can only ADD, and only while open; staff read)
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid references public.kids(id) on delete set null,
  kid_name   text not null default '' check (char_length(kid_name) <= 30),
  mood       smallint not null default 0 check (mood between 0 and 4),
  message    text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
grant insert on public.feedback to anon, authenticated;
grant select, delete on public.feedback to authenticated;
drop policy if exists kid_insert   on public.feedback;
drop policy if exists staff_read   on public.feedback;
drop policy if exists staff_delete on public.feedback;
create policy kid_insert   on public.feedback for insert to anon, authenticated with check (public.feedback_open());
create policy staff_read   on public.feedback for select to authenticated using (public.is_staff());
create policy staff_delete on public.feedback for delete to authenticated using (public.is_staff());
