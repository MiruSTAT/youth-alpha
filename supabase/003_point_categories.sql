-- =====================================================================
-- Youth Alpha — update 3: editable point categories (+ info), new categories
-- Run once in Supabase > SQL Editor (after 002). Safe to re-run.
-- =====================================================================

create table if not exists public.point_categories (
  key     text primary key check (key ~ '^[a-z0-9_]{1,30}$'),
  name_th text not null check (char_length(name_th) between 1 and 40),
  name_en text not null default '',
  icon    text not null default '⭐',
  info    text not null default '' check (char_length(info) <= 500),   -- extra info kids see when they tap
  sort    int  not null default 0,
  active  boolean not null default true
);

insert into public.point_categories (key, name_th, name_en, icon, info, sort) values
  ('piano',      'เปียโน',      'Piano',             '🎹', '', 1),
  ('singing',    'ร้องเพลง',     'Singing',           '🎤', '', 2),
  ('practice',   'ซ้อมดนตรี',    'Musical practice',  '🎼', '', 3),
  ('english',    'อังกฤษ',       'English',           '🔤', '', 4),
  ('thai',       'อ่านไทย',      'Thai reading',      '📖', '', 5),
  ('questions',  'ตอบคำถาม',     'Answering questions','🙋', '', 6),
  ('chores',     'งานบ้าน',      'Chores',            '🧽', 'เช่น ล้างจาน', 7),
  ('attendance', 'มาร่วม',       'Came',              '⛪', 'ได้คะแนนอัตโนมัติทุกครั้งที่มาร่วมกิจกรรม', 8),
  ('bonus',      'โบนัส',        'Bonus',             '🎁', '', 9)
on conflict (key) do nothing;

-- points.skill: from a fixed list -> any category in the table
alter table public.points drop constraint if exists points_skill_check;
alter table public.points drop constraint if exists points_skill_fkey;
alter table public.points add constraint points_skill_fkey
  foreign key (skill) references public.point_categories(key) on update cascade;

-- Public views: total per kid, and total per kid per category (nickname/avatar/points only)
drop view if exists public.leaderboard;
create view public.leaderboard as
select k.id, k.nickname, k.avatar, coalesce(sum(p.amount), 0)::int as total
from public.kids k left join public.points p on p.kid_id = k.id
where k.active
group by k.id, k.nickname, k.avatar;

create or replace view public.kid_skill_totals as
select p.kid_id, p.skill, sum(p.amount)::int as total
from public.points p join public.kids k on k.id = p.kid_id and k.active
group by p.kid_id, p.skill;

grant select on public.leaderboard, public.kid_skill_totals to anon, authenticated;

alter table public.point_categories enable row level security;
grant select on public.point_categories to anon, authenticated;
drop policy if exists public_read on public.point_categories;
drop policy if exists staff_all on public.point_categories;
create policy public_read on public.point_categories for select to anon, authenticated using (true);
create policy staff_all on public.point_categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
