-- =====================================================================
-- Youth Alpha — database setup (run once in Supabase > SQL Editor)
-- Safe to re-run: it only creates things that don't exist yet.
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

-- Adults who can edit (Admin + Editors). Linked to Supabase login accounts.
create table if not exists public.staff (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role         text not null check (role in ('admin','editor')),
  created_at   timestamptz not null default now()
);

-- Kids. Only nickname + avatar are ever shown publicly.
create table if not exists public.kids (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null check (char_length(nickname) between 1 and 30),
  avatar     text not null default '⛄',
  grp        text not null default '',          -- optional group/age band (adults only)
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Attendance: exactly ONE status per kid per day per session.
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references public.kids(id) on delete cascade,
  day        date not null,
  session    text not null default 'main',
  status     text not null check (status in ('present','leave','absent')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (kid_id, day, session)
);

-- "Finished" marker for an attendance round.
create table if not exists public.attendance_rounds (
  day         date not null,
  session     text not null default 'main',
  finished    boolean not null default false,
  finished_by uuid references auth.users(id),
  finished_at timestamptz,
  primary key (day, session)
);

-- Points. Attendance points are linked to the attendance row (unique),
-- so changing attendance later can never give points twice.
create table if not exists public.points (
  id            uuid primary key default gen_random_uuid(),
  kid_id        uuid not null references public.kids(id) on delete cascade,
  skill         text not null check (skill in ('piano','singing','english','thai','attendance','bonus')),
  amount        integer not null check (amount between -1000 and 1000),
  note          text not null default '',
  attendance_id uuid unique references public.attendance(id) on delete cascade,
  given_by      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- Real money, typed in by adults. "earned" and "paid" kept separate.
create table if not exists public.money (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references public.kids(id) on delete cascade,
  kind       text not null check (kind in ('earned','paid')),
  amount     numeric(10,2) not null check (amount > 0),
  note       text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- App settings (single row).
create table if not exists public.settings (
  id                int primary key default 1 check (id = 1),
  attendance_points int not null default 10 check (attendance_points between 0 and 1000)
);
insert into public.settings (id) values (1) on conflict do nothing;

create index if not exists points_kid_idx on public.points(kid_id);
create index if not exists money_kid_idx  on public.money(kid_id);
create index if not exists att_day_idx    on public.attendance(day, session);

-- ---------- Permission helpers (checked on the SERVER) ----------------

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin');
$$;

-- What am I? Returns 'admin' | 'editor' | 'pending' | null (not logged in)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then null
    else coalesce((select role from public.staff where user_id = auth.uid()), 'pending')
  end;
$$;

-- The very first person to log in becomes Admin (only works while there is no admin).
create or replace function public.claim_admin(p_name text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  if exists (select 1 from public.staff where role = 'admin') then
    return 'already_has_admin';
  end if;
  insert into public.staff(user_id, display_name, role) values (auth.uid(), coalesce(p_name,''), 'admin');
  return 'ok';
end; $$;

-- Admin only: accounts that signed up but are not approved yet.
create or replace function public.pending_users()
returns table (user_id uuid, email text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select u.id, u.email::text, u.created_at
    from auth.users u
    where not exists (select 1 from public.staff s where s.user_id = u.id)
    order by u.created_at desc;
end; $$;

-- Admin only: list staff with emails.
create or replace function public.staff_list()
returns table (user_id uuid, email text, display_name text, role text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return query
    select s.user_id, u.email::text, s.display_name, s.role
    from public.staff s join auth.users u on u.id = s.user_id
    order by s.role, u.email;
end; $$;

-- ---------- Attendance -> points (automatic, never doubled) -----------

create or replace function public.sync_attendance_points() returns trigger
language plpgsql security definer set search_path = public as $$
declare pts int;
begin
  select attendance_points into pts from public.settings where id = 1;
  -- remove any points this attendance row gave before
  delete from public.points where attendance_id = new.id;
  if new.status = 'present' and coalesce(pts,0) > 0 then
    insert into public.points(kid_id, skill, amount, note, attendance_id, given_by)
    values (new.kid_id, 'attendance', pts, to_char(new.day,'YYYY-MM-DD'), new.id, new.updated_by);
  end if;
  return new;
end; $$;

drop trigger if exists attendance_points_trg on public.attendance;
create trigger attendance_points_trg
after insert or update of status on public.attendance
for each row execute function public.sync_attendance_points();

-- ---------- Public leaderboard (nickname, avatar, points ONLY) --------

create or replace view public.leaderboard as
select
  k.id,
  k.nickname,
  k.avatar,
  coalesce(sum(p.amount), 0)::int                                         as total,
  coalesce(sum(p.amount) filter (where p.skill = 'piano'), 0)::int        as piano,
  coalesce(sum(p.amount) filter (where p.skill = 'singing'), 0)::int      as singing,
  coalesce(sum(p.amount) filter (where p.skill = 'english'), 0)::int      as english,
  coalesce(sum(p.amount) filter (where p.skill = 'thai'), 0)::int         as thai,
  coalesce(sum(p.amount) filter (where p.skill = 'attendance'), 0)::int   as attendance,
  coalesce(sum(p.amount) filter (where p.skill = 'bonus'), 0)::int        as bonus
from public.kids k
left join public.points p on p.kid_id = k.id
where k.active
group by k.id, k.nickname, k.avatar;

-- ---------- Row Level Security ----------------------------------------

alter table public.staff             enable row level security;
alter table public.kids              enable row level security;
alter table public.attendance        enable row level security;
alter table public.attendance_rounds enable row level security;
alter table public.points            enable row level security;
alter table public.money             enable row level security;
alter table public.settings          enable row level security;

-- Visitors (not logged in) can read ONLY the leaderboard view.
revoke all on public.staff, public.kids, public.attendance, public.attendance_rounds,
              public.points, public.money, public.settings from anon;
grant select on public.leaderboard to anon, authenticated;

-- Staff: full access to working tables
do $$
declare t text;
begin
  foreach t in array array['kids','attendance','attendance_rounds','points','money'] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated
                    using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

drop policy if exists settings_read  on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read  on public.settings for select to authenticated using (public.is_staff());
create policy settings_write on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Staff table: everyone sees own row; admin manages all
drop policy if exists staff_self   on public.staff;
drop policy if exists staff_admin  on public.staff;
create policy staff_self  on public.staff for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy staff_admin on public.staff for all    to authenticated using (public.is_admin()) with check (public.is_admin());

grant execute on function public.my_role(), public.claim_admin(text),
                          public.pending_users(), public.staff_list() to authenticated;

-- NOTE: after this file, also run 002_schedule_shop.sql, 003_point_categories.sql , 004_music_feedback_event.sql , 005_timings.sql , 006_feedback_switch.sql and 007_bonus_positive.sql
