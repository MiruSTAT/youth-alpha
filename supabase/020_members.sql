-- =====================================================================
-- 020  v31 — member login (username + password), switchable per program
--
--   programs.login_mode:
--     'off'      (default) the app works exactly as before: no sign-in, "this is me" by tapping a name
--     'personal' anyone sees the ranking (nickname / avatar / points); a kid's point details
--                (per category) are shown only to that kid's signed-in member account (and staff)
--     'all'      every kid page needs a signed-in member: ranking, point details, songs and prizes
--                are hidden from anyone who is not signed in (staff always see everything)
--
--   Accounts live in private.members (bcrypt hash, never readable from the app). A sign-in gives a
--   random token; the app sends it on every request in the header `x-member-token`; only its
--   sha256 is stored (private.member_sessions, 30 days). Admins create accounts, link them to a kid,
--   reset passwords and switch accounts off — accounts are never deleted. 5 wrong passwords lock an
--   account for 15 minutes. Every admin change goes to audit_log.
--   Nothing existing is changed while login_mode is 'off' (the views only gain a condition that is
--   true when the mode is 'off').
-- =====================================================================

alter table public.programs add column if not exists login_mode text not null default 'off'
  check (login_mode in ('off', 'personal', 'all'));

create table if not exists private.members (
  id           uuid primary key default gen_random_uuid(),
  program_id   int not null references public.programs(id),
  username     text not null check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  pw_hash      text not null,
  kid_id       uuid references public.kids(id),
  active       boolean not null default true,
  failed       int not null default 0,
  locked_until timestamptz,
  last_login   timestamptz,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  unique (program_id, username)
);
create table if not exists private.member_sessions (
  token_hash text primary key,
  member_id  uuid not null references private.members(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table private.members enable row level security;
alter table private.member_sessions enable row level security;

-- ---------- the signed-in member of this request (from the x-member-token header), for one program
create or replace function public.member_current(p int) returns table (member_id uuid, kid_id uuid)
language sql stable security definer set search_path = public, private, extensions as $$
  select m.id, m.kid_id
  from private.member_sessions s join private.members m on m.id = s.member_id
  where s.token_hash = encode(extensions.digest(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-member-token', ''), 'sha256'), 'hex')
    and s.expires_at > now() and m.active and m.program_id = p
  limit 1;
$$;
revoke all on function public.member_current(int) from public;
grant execute on function public.member_current(int) to anon, authenticated;

create or replace function public.login_mode(p int) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select login_mode from public.programs where id = p), 'off');
$$;
grant execute on function public.login_mode(int) to anon, authenticated;

-- may this request see program p's kid pages? (ranking, songs, prizes)
create or replace function public.member_ok(p int) returns boolean
language sql stable security definer set search_path = public as $$
  select public.login_mode(p) <> 'all' or public.is_staff() or exists (select 1 from public.member_current(p));
$$;
grant execute on function public.member_ok(int) to anon, authenticated;

-- may this request see one kid's point details?
create or replace function public.member_sees_kid(p int, kid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.login_mode(p)
    when 'off' then true
    when 'all' then public.is_staff() or exists (select 1 from public.member_current(p))
    else public.is_staff() or exists (select 1 from public.member_current(p) c where c.kid_id = kid) end;
$$;
grant execute on function public.member_sees_kid(int, uuid) to anon, authenticated;

-- ---------- views and read rules gain the login check (same columns as before)
create or replace view public.leaderboard as
select k.id, k.nickname, k.avatar,
  coalesce((select sum(p.amount) from public.points p where p.kid_id = k.id), 0)::int as total,
  coalesce((select sum(r.price) from public.redemptions r where r.kid_id = k.id), 0)::int as spent,
  k.program_id
from public.kids k
where k.active and public.member_ok(k.program_id);

create or replace view public.kid_skill_totals as
select p.kid_id, p.skill, p.detail, sum(p.amount)::int as total, k.program_id
from public.points p join public.kids k on k.id = p.kid_id and k.active
where public.member_sees_kid(k.program_id, k.id)
group by p.kid_id, p.skill, p.detail, k.program_id;
grant select on public.leaderboard, public.kid_skill_totals to anon, authenticated;

drop policy if exists public_read on public.songs;
create policy public_read on public.songs for select to anon, authenticated
  using ((active and public.member_ok(program_id)) or public.is_staff());
drop policy if exists public_read on public.shop_items;
create policy public_read on public.shop_items for select to anon, authenticated
  using ((active and public.member_ok(program_id)) or public.is_staff());

-- ---------- super admin: the program's login mode
create or replace function public.program_set_login(p_id int, p_mode text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if p_mode not in ('off', 'personal', 'all') then raise exception 'bad mode'; end if;
  update public.programs set login_mode = p_mode where id = p_id;
  if not found then raise exception 'no such program'; end if;
end; $$;
revoke all on function public.program_set_login(int, text) from public, anon;
grant execute on function public.program_set_login(int, text) to authenticated;

-- ---------- members: sign in / out / who am I / change own password (anyone may call; checked inside)
create or replace function public.member_login(p_program int, p_username text, p_password text) returns json
language plpgsql security definer set search_path = public, private, extensions as $$
declare m private.members; tok text;
begin
  perform pg_sleep(0.3);
  select * into m from private.members where program_id = p_program and username = lower(btrim(coalesce(p_username, '')));
  if not found or not m.active then return json_build_object('ok', false, 'reason', 'wrong'); end if;
  if m.locked_until is not null and m.locked_until > now() then
    return json_build_object('ok', false, 'reason', 'locked', 'minutes', ceil(extract(epoch from m.locked_until - now()) / 60));
  end if;
  if extensions.crypt(coalesce(p_password, ''), m.pw_hash) <> m.pw_hash then
    update private.members
      set failed = case when failed + 1 >= 5 then 0 else failed + 1 end,
          locked_until = case when failed + 1 >= 5 then now() + interval '15 minutes' else locked_until end
      where id = m.id;
    return json_build_object('ok', false, 'reason', 'wrong');
  end if;
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  insert into private.member_sessions (token_hash, member_id, expires_at)
    values (encode(extensions.digest(tok, 'sha256'), 'hex'), m.id, now() + interval '30 days');
  update private.members set failed = 0, locked_until = null, last_login = now() where id = m.id;
  return json_build_object('ok', true, 'token', tok, 'username', m.username, 'display_name', m.display_name, 'kid_id', m.kid_id);
end; $$;
revoke all on function public.member_login(int, text, text) from public;
grant execute on function public.member_login(int, text, text) to anon, authenticated;

-- who is signed in (by the x-member-token header); empty when nobody
create or replace function public.member_me(p_program int) returns json
language sql stable security definer set search_path = public, private as $$
  select json_build_object('username', m.username, 'display_name', m.display_name, 'kid_id', m.kid_id)
  from public.member_current(p_program) c join private.members m on m.id = c.member_id;
$$;
revoke all on function public.member_me(int) from public;
grant execute on function public.member_me(int) to anon, authenticated;

-- sign out: the session ends (the row is kept, expired, as a record)
create or replace function public.member_logout(p_program int) returns void
language plpgsql security definer set search_path = public, private, extensions as $$
begin
  update private.member_sessions set expires_at = now()
  where token_hash = encode(extensions.digest(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-member-token', ''), 'sha256'), 'hex');
end; $$;
revoke all on function public.member_logout(int) from public;
grant execute on function public.member_logout(int) to anon, authenticated;

create or replace function public.member_password(p_program int, p_old text, p_new text) returns json
language plpgsql security definer set search_path = public, private, extensions as $$
declare m private.members;
begin
  perform pg_sleep(0.3);
  select x.* into m from public.member_current(p_program) c join private.members x on x.id = c.member_id;
  if not found then return json_build_object('ok', false, 'reason', 'signin'); end if;
  if extensions.crypt(coalesce(p_old, ''), m.pw_hash) <> m.pw_hash then return json_build_object('ok', false, 'reason', 'wrong'); end if;
  if char_length(coalesce(p_new, '')) < 4 then return json_build_object('ok', false, 'reason', 'short'); end if;
  update private.members set pw_hash = extensions.crypt(p_new, extensions.gen_salt('bf', 10)) where id = m.id;
  return json_build_object('ok', true);
end; $$;
revoke all on function public.member_password(int, text, text) from public;
grant execute on function public.member_password(int, text, text) to anon, authenticated;

-- ---------- admins: list / create / change / reset password (never delete; switch off instead)
create or replace function public.member_list(p_program int) returns table (
  id uuid, username text, display_name text, kid_id uuid, kid_name text, active boolean, last_login timestamptz, locked boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  return query select m.id, m.username, m.display_name, m.kid_id, k.nickname, m.active, m.last_login,
    coalesce(m.locked_until > now(), false), m.created_at
    from private.members m left join public.kids k on k.id = m.kid_id
    where m.program_id = p_program order by m.username;
end; $$;
revoke all on function public.member_list(int) from public, anon;
grant execute on function public.member_list(int) to authenticated;

create or replace function public.member_save(p_program int, p_id uuid, p_username text, p_display text, p_kid uuid, p_active boolean, p_password text)
returns uuid
language plpgsql security definer set search_path = public, private, extensions as $$
declare u text := lower(btrim(coalesce(p_username, ''))); mid uuid; old jsonb;
begin
  if not public.is_admin() then raise exception 'admins only'; end if;
  if p_kid is not null and not exists (select 1 from public.kids where id = p_kid and program_id = p_program) then raise exception 'kid not in this program'; end if;
  if p_password is not null and char_length(p_password) < 4 then raise exception 'password too short'; end if;
  if p_id is null then
    if p_password is null then raise exception 'password needed'; end if;
    insert into private.members (program_id, username, display_name, pw_hash, kid_id, active, created_by)
      values (p_program, u, btrim(coalesce(p_display, '')), extensions.crypt(p_password, extensions.gen_salt('bf', 10)), p_kid, coalesce(p_active, true), auth.uid())
      returning id into mid;
  else
    select to_jsonb(m) - 'pw_hash' into old from private.members m where id = p_id and program_id = p_program;
    if old is null then raise exception 'no such account'; end if;
    update private.members set username = u, display_name = btrim(coalesce(p_display, '')), kid_id = p_kid, active = coalesce(p_active, active),
      pw_hash = case when p_password is null then pw_hash else extensions.crypt(p_password, extensions.gen_salt('bf', 10)) end,
      failed = case when p_password is null then failed else 0 end,
      locked_until = case when p_password is null then locked_until else null end
      where id = p_id;
    mid := p_id;
    if not coalesce(p_active, true) then update private.member_sessions set expires_at = least(expires_at, now()) where member_id = p_id; end if;
  end if;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, old_data, new_data)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'members', case when p_id is null then 'INSERT' else 'UPDATE' end, mid::text, old,
    (select to_jsonb(m) - 'pw_hash' || jsonb_build_object('password_changed', p_password is not null) from private.members m where id = mid));
  return mid;
end; $$;
revoke all on function public.member_save(int, uuid, text, text, uuid, boolean, text) from public, anon;
grant execute on function public.member_save(int, uuid, text, text, uuid, boolean, text) to authenticated;
