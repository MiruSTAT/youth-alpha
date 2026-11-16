-- =====================================================================
-- 021  v32 — admins per program with a permission checklist, approval by the super admin,
--             logs for the super admin only, admin log split per program, online admin tracker.
--             Safe to re-run.
--
--  * public.staff stays the list of adult accounts (one row per login). New column `active`
--    (switched off = no access anywhere; accounts are never deleted).
--  * public.staff_programs: which programs an adult may open and what they may do there.
--    perms is a list of: points (points & attendance), kids (kids list + member accounts),
--    songs, shop (shop & prizes given), feedback, notice (announcement & verse),
--    settings (point categories, music switches, general settings).
--    A row with an empty list = no access to that program (rows are never deleted).
--  * in_program(p) / can(p, perm) are checked by every security rule. The super admin passes all of them
--    ("everything an admin can do, the super admin can do too").
--  * is_staff() = super admin, or an active adult with access to at least one program.
--    is_admin() = super admin only now (everything that was "admin only" is either a permission or super-only).
--  * New adults: the super admin makes the account in the app (admin_create) or approves one that is
--    waiting (admin_save), and picks its programs and permissions. Existing adults keep their rights
--    on program 1 (admin = everything, editor = everything except settings, as before).
--  * audit_log (permanent) gets program_id; only the super admin can read it. kid_events: only the
--    super admin can read the rows; admins get counts for the weekly summary (kid_week_stats).
--  * admin_presence: "who is online" (admin_ping every ~45 s from the admin pages; admin_online for the
--    super admin).
-- =====================================================================

-- ---------- tables
alter table public.staff add column if not exists active boolean not null default true;

create table if not exists public.staff_programs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  program_id int  not null references public.programs(id),
  perms      text[] not null default '{}'
             check (perms <@ array['points','kids','songs','shop','feedback','notice','settings']::text[]),
  updated_at timestamptz not null default now(),
  primary key (user_id, program_id)
);
alter table public.staff_programs enable row level security;
revoke all on public.staff_programs from anon, authenticated;
grant select on public.staff_programs to authenticated;

create table if not exists public.admin_presence (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  program_id int,
  page       text not null default '' check (char_length(page) <= 40),
  seen_at    timestamptz not null default now()
);
alter table public.admin_presence enable row level security;
revoke all on public.admin_presence from anon, authenticated;

alter table public.audit_log add column if not exists program_id int;
create index if not exists audit_log_program_idx on public.audit_log(program_id, created_at);

-- existing adults keep what they had, on program 1 (never removes anything already there)
insert into public.staff_programs (user_id, program_id, perms)
select s.user_id, 1, case when s.role = 'admin' then array['points','kids','songs','shop','feedback','notice','settings']
                          else array['points','kids','songs','shop','feedback','notice'] end
from public.staff s
on conflict (user_id, program_id) do nothing;

-- ---------- who may do what
create or replace function public.in_program(p int) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists (
    select 1 from public.staff s join public.staff_programs sp on sp.user_id = s.user_id
    where s.user_id = auth.uid() and s.active and sp.program_id = p and cardinality(sp.perms) > 0);
$$;
create or replace function public.can(p int, perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists (
    select 1 from public.staff s join public.staff_programs sp on sp.user_id = s.user_id
    where s.user_id = auth.uid() and s.active and sp.program_id = p and perm = any(sp.perms));
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists (
    select 1 from public.staff s join public.staff_programs sp on sp.user_id = s.user_id
    where s.user_id = auth.uid() and s.active and cardinality(sp.perms) > 0);
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin();
$$;
grant execute on function public.in_program(int), public.can(int, text) to anon, authenticated;

-- 'superadmin' | 'superlocked' | 'superclaim' | 'admin' | 'editor' | 'noaccess' (switched off / no program) | 'pending' | null
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public, private as $$
  select case
    when auth.uid() is null then null
    when public.is_superadmin() then 'superadmin'
    when exists (select 1 from private.super_admins where user_id = auth.uid()) then 'superlocked'
    when not exists (select 1 from private.super_admins)
      and exists (select 1 from private.owner o join auth.users u on lower(u.email) = lower(o.email) where u.id = auth.uid()) then 'superclaim'
    when not exists (select 1 from public.staff where user_id = auth.uid()) then 'pending'
    when not public.is_staff() then 'noaccess'
    else (select role from public.staff where user_id = auth.uid())
  end;
$$;

-- my programs and permissions: {"all": true} for the super admin, else {"programs": {"1": ["points", …]}}
create or replace function public.my_access() returns json
language sql stable security definer set search_path = public as $$
  select case
    when public.is_superadmin() then json_build_object('all', true)
    else json_build_object('all', false, 'programs', coalesce((
      select json_object_agg(sp.program_id::text, sp.perms)
      from public.staff s join public.staff_programs sp on sp.user_id = s.user_id
      where s.user_id = auth.uid() and s.active and cardinality(sp.perms) > 0), '{}'::json))
  end;
$$;
revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- ---------- security rules, table by table: read = has the program; write = the permission
do $$
declare r record;
begin
  for r in select * from (values
      ('kids', 'kids'), ('attendance', 'points'), ('attendance_rounds', 'points'), ('points', 'points'),
      ('redemptions', 'shop')) v(tbl, perm) loop
    execute format('drop policy if exists staff_all on public.%I', r.tbl);
    execute format('drop policy if exists staff_read on public.%I', r.tbl);
    execute format('drop policy if exists staff_ins on public.%I', r.tbl);
    execute format('drop policy if exists staff_upd on public.%I', r.tbl);
    execute format('drop policy if exists staff_del on public.%I', r.tbl);
    execute format('create policy staff_read on public.%I for select to authenticated using (public.in_program(program_id))', r.tbl);
    execute format('create policy staff_ins on public.%I for insert to authenticated with check (public.can(program_id, %L))', r.tbl, r.perm);
    execute format('create policy staff_upd on public.%I for update to authenticated using (public.can(program_id, %L)) with check (public.can(program_id, %L))', r.tbl, r.perm, r.perm);
    execute format('create policy staff_del on public.%I for delete to authenticated using (public.can(program_id, %L))', r.tbl, r.perm);
  end loop;
end $$;

-- point categories (everyone may read them): write = settings
drop policy if exists staff_all on public.point_categories;
create policy staff_all on public.point_categories for all to authenticated
  using (public.can(program_id, 'settings')) with check (public.can(program_id, 'settings'));

-- prizes and songs: kids read them (with the v31 member rule); adults of the program read all; write = permission
drop policy if exists public_read on public.shop_items;
create policy public_read on public.shop_items for select to anon, authenticated
  using ((active and public.member_ok(program_id)) or public.in_program(program_id));
drop policy if exists staff_all on public.shop_items;
create policy staff_all on public.shop_items for all to authenticated
  using (public.can(program_id, 'shop')) with check (public.can(program_id, 'shop'));
drop policy if exists public_read on public.songs;
create policy public_read on public.songs for select to anon, authenticated
  using ((active and public.member_ok(program_id)) or public.in_program(program_id));
drop policy if exists staff_write on public.songs;
create policy staff_write on public.songs for all to authenticated
  using (public.can(program_id, 'songs')) with check (public.can(program_id, 'songs'));

-- feedback: read = feedback permission (kids still send it while it is open; it can never be deleted)
drop policy if exists staff_read on public.feedback;
create policy staff_read on public.feedback for select to authenticated using (public.can(program_id, 'feedback'));

-- settings (one row per program): read = has the program. Update = has the program, and the guard
-- trigger below checks each changed column against its permission.
drop policy if exists settings_read on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read on public.settings for select to authenticated using (public.in_program(id));
create policy settings_write on public.settings for update to authenticated using (public.in_program(id)) with check (public.in_program(id));

create or replace function public.settings_super_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  for k in select key from jsonb_each(to_jsonb(new)) where to_jsonb(new)->key is distinct from to_jsonb(old)->key loop
    if k = 'install_on' then
      if not public.is_superadmin() then raise exception 'only the super admin can change install_on'; end if;
    elsif k = 'fb_open' then
      if not (public.can(new.id, 'feedback') or public.can(new.id, 'settings')) then raise exception 'no permission: feedback'; end if;
    elsif k in ('announce', 'verse_text', 'verse_ref') then
      if not (public.can(new.id, 'notice') or public.can(new.id, 'settings')) then raise exception 'no permission: notice'; end if;
    else
      if not public.can(new.id, 'settings') then raise exception 'no permission: settings'; end if;
    end if;
  end loop;
  return new;
end; $$;
drop trigger if exists settings_super_guard on public.settings;
create trigger settings_super_guard before update on public.settings
for each row execute function public.settings_super_guard();

-- logs: only the super admin reads them
drop policy if exists staff_read on public.audit_log;
create policy staff_read on public.audit_log for select to authenticated using (public.is_superadmin());
drop policy if exists staff_read on public.kid_events;
create policy staff_read on public.kid_events for select to authenticated using (public.is_superadmin());

-- the adult list: own row, or the super admin. Changes only through the functions below.
drop policy if exists staff_self on public.staff;
drop policy if exists staff_admin on public.staff;
create policy staff_self on public.staff for select to authenticated using (user_id = auth.uid() or public.is_superadmin());
create policy staff_admin on public.staff for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists own_read on public.staff_programs;
create policy own_read on public.staff_programs for select to authenticated using (user_id = auth.uid() or public.is_superadmin());

-- old tables that are no longer used: super admin only
do $$
declare t text;
begin
  foreach t in array array['money', 'schedule', 'shop_categories'] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_superadmin()) with check (public.is_superadmin())', t);
  end loop;
end $$;

-- v31 member rules: "staff see everything" now means adults of THAT program
create or replace function public.member_ok(p int) returns boolean
language sql stable security definer set search_path = public as $$
  select public.login_mode(p) <> 'all' or public.in_program(p) or exists (select 1 from public.member_current(p));
$$;
create or replace function public.member_sees_kid(p int, kid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.login_mode(p)
    when 'off' then true
    when 'all' then public.in_program(p) or exists (select 1 from public.member_current(p))
    else public.in_program(p) or exists (select 1 from public.member_current(p) c where c.kid_id = kid) end;
$$;

-- ---------- the admin log: every row now says which program it belongs to
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  k text  := coalesce(n->>'id', o->>'id', n->>'key', o->>'key', n->>'user_id', o->>'user_id', n->>'day', o->>'day', '');
  pid int := coalesce((n->>'program_id')::int, (o->>'program_id')::int,
                      case when TG_TABLE_NAME in ('settings', 'programs') then coalesce(n->>'id', o->>'id')::int end);
begin
  if TG_OP = 'UPDATE' and o = n then return null; end if;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, old_data, new_data, program_id)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), TG_TABLE_NAME, TG_OP, k, o, n, pid);
  return null;
end; $$;
drop trigger if exists audit_staff_programs on public.staff_programs;
create trigger audit_staff_programs after insert or update or delete on public.staff_programs
for each row execute function public.audit_trigger();

-- ---------- functions that were "admin" or "staff": now permission based
create or replace function public.save_notice(p_announce text, p_verse_text text, p_verse_ref text, p_program int default 1) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.can(p_program, 'notice') or public.can(p_program, 'settings')) then raise exception 'no permission: notice'; end if;
  update public.settings set announce = left(btrim(coalesce(p_announce, '')), 160),
    verse_text = left(btrim(coalesce(p_verse_text, '')), 400), verse_ref = left(btrim(coalesce(p_verse_ref, '')), 60)
  where id = p_program;
end; $$;

create or replace function public.member_list(p_program int) returns table (
  id uuid, username text, display_name text, kid_id uuid, kid_name text, active boolean, last_login timestamptz, locked boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not public.can(p_program, 'kids') then raise exception 'no permission: kids'; end if;
  return query select m.id, m.username, m.display_name, m.kid_id, k.nickname, m.active, m.last_login,
    coalesce(m.locked_until > now(), false), m.created_at
    from private.members m left join public.kids k on k.id = m.kid_id
    where m.program_id = p_program order by m.username;
end; $$;

create or replace function public.member_save(p_program int, p_id uuid, p_username text, p_display text, p_kid uuid, p_active boolean, p_password text)
returns uuid
language plpgsql security definer set search_path = public, private, extensions as $$
declare u text := lower(btrim(coalesce(p_username, ''))); mid uuid; old jsonb;
begin
  if not public.can(p_program, 'kids') then raise exception 'no permission: kids'; end if;
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
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, old_data, new_data, program_id)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'members', case when p_id is null then 'INSERT' else 'UPDATE' end, mid::text, old,
    (select to_jsonb(m) - 'pw_hash' || jsonb_build_object('password_changed', p_password is not null) from private.members m where id = mid), p_program);
  return mid;
end; $$;

-- clearing the kids' activity log: super admin only (logs are the super admin's), password re-entered
create or replace function public.clear_kid_events(p_program int default 1) returns int
language plpgsql security definer set search_path = public, private as $$
declare cnt int;
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if not exists (select 1 from private.super_admins where user_id = auth.uid() and pw_ok_at > now() - interval '2 minutes') then
    raise exception 'please re-enter the password';
  end if;
  delete from public.kid_events where program_id = p_program;
  get diagnostics cnt = row_count;
  update private.super_admins set pw_ok_at = null where user_id = auth.uid();
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, new_data, program_id)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'kid_events', 'CLEAR', p_program::text,
          jsonb_build_object('rows_deleted', cnt, 'program_id', p_program), p_program);
  return cnt;
end; $$;

-- weekly summary for admins: counts only (the rows themselves are the super admin's)
create or replace function public.kid_week_stats(p_program int, p_since timestamptz) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.in_program(p_program) then raise exception 'no access to this program'; end if;
  return json_build_object(
    'phones', (select count(distinct device_id) from public.kid_events where program_id = p_program and created_at >= p_since),
    'songs', coalesce((select json_agg(x order by x.n desc) from (
       select detail as title, count(*) as n, count(distinct device_id) as devices from public.kid_events
       where program_id = p_program and created_at >= p_since and event = 'song_open' and detail <> ''
       group by detail order by count(*) desc limit 5) x), '[]'::json));
end; $$;
revoke all on function public.kid_week_stats(int, timestamptz) from public, anon;
grant execute on function public.kid_week_stats(int, timestamptz) to authenticated;

-- the old lists: super admin only now
create or replace function public.pending_users()
returns table (user_id uuid, email text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  return query select u.id, u.email::text, u.created_at from auth.users u
    where not exists (select 1 from public.staff s where s.user_id = u.id) order by u.created_at desc;
end; $$;
create or replace function public.staff_list()
returns table (user_id uuid, email text, display_name text, role text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  return query select s.user_id, u.email::text, s.display_name, s.role
    from public.staff s join auth.users u on u.id = s.user_id order by s.role, u.email;
end; $$;

-- ---------- super admin: the adults, their programs and permissions
-- every login except the super admin's own: adults (with access) and accounts waiting for approval
create or replace function public.admin_list() returns json
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  return coalesce((select json_agg(x order by x.pending desc, x.name) from (
    select u.id as user_id,
      case when u.email like '%@youth-alpha.app' then split_part(u.email, '@', 1) else u.email end as username,
      coalesce(nullif(s.display_name, ''), split_part(u.email, '@', 1)) as name,
      s.user_id is null as pending, coalesce(s.active, false) as active, s.role,
      u.email like '%@youth-alpha.app' as app_login,
      u.created_at, u.last_sign_in_at,
      coalesce((select json_object_agg(sp.program_id::text, sp.perms) from public.staff_programs sp where sp.user_id = u.id), '{}'::json) as access
    from auth.users u left join public.staff s on s.user_id = u.id
    where not exists (select 1 from private.super_admins a where a.user_id = u.id)) x), '[]'::json);
end; $$;
revoke all on function public.admin_list() from public, anon;
grant execute on function public.admin_list() to authenticated;

-- approve / change one adult: name, on/off, and {"<program id>": ["points", …], …}.
-- Programs left out of p_access keep their row but with no permissions (nothing is deleted).
create or replace function public.admin_save(p_user uuid, p_display text, p_active boolean, p_access jsonb) returns void
language plpgsql security definer set search_path = public, private as $$
declare k text; v jsonb;
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if exists (select 1 from private.super_admins where user_id = p_user) then raise exception 'not for the super admin account'; end if;
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'no such account'; end if;
  if p_access is null or jsonb_typeof(p_access) <> 'object' then raise exception 'access must be an object'; end if;
  insert into public.staff (user_id, display_name, role, active) values (p_user, left(btrim(coalesce(p_display, '')), 40), 'admin', coalesce(p_active, true))
  on conflict (user_id) do update set display_name = excluded.display_name, active = excluded.active;
  update public.staff_programs set perms = '{}', updated_at = now()
    where user_id = p_user and cardinality(perms) > 0 and not (p_access ? program_id::text);
  for k, v in select * from jsonb_each(p_access) loop
    if not exists (select 1 from public.programs where id = k::int) then raise exception 'unknown program %', k; end if;
    insert into public.staff_programs (user_id, program_id, perms, updated_at)
    values (p_user, k::int, array(select distinct jsonb_array_elements_text(v)), now())
    on conflict (user_id, program_id) do update set perms = excluded.perms, updated_at = now()
      where staff_programs.perms is distinct from excluded.perms;
  end loop;
end; $$;
revoke all on function public.admin_save(uuid, text, boolean, jsonb) from public, anon;
grant execute on function public.admin_save(uuid, text, boolean, jsonb) to authenticated;

-- make a new admin login (username + password, like the existing "admin"); it starts with no programs.
-- The new auth.users / auth.identities rows copy their fixed fields from an existing working app login.
create or replace function public.admin_create(p_username text, p_password text, p_display text) returns uuid
language plpgsql security definer set search_path = public, private, extensions, auth as $$
declare u text := lower(btrim(coalesce(p_username, ''))); em text; nid uuid := gen_random_uuid(); tpl auth.users;
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if u !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'bad username'; end if;
  if char_length(coalesce(p_password, '')) < 6 then raise exception 'password too short'; end if;
  em := u || '@youth-alpha.app';
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'duplicate username'; end if;
  select * into tpl from auth.users where email like '%@youth-alpha.app' order by created_at limit 1;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (coalesce(tpl.instance_id, '00000000-0000-0000-0000-000000000000'), nid, 'authenticated', 'authenticated', em,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, now(), now());
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (nid::text, nid, jsonb_build_object('sub', nid::text, 'email', em, 'email_verified', false, 'phone_verified', false), 'email', null, now(), now());
  insert into public.staff (user_id, display_name, role, active) values (nid, left(btrim(coalesce(p_display, '')), 40), 'admin', true);
  return nid;
end; $$;
revoke all on function public.admin_create(text, text, text) from public, anon;
grant execute on function public.admin_create(text, text, text) to authenticated;

-- set a new password for an app login (not the super admin's). Logged without the password.
create or replace function public.admin_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, private, extensions, auth as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if char_length(coalesce(p_password, '')) < 6 then raise exception 'password too short'; end if;
  if exists (select 1 from private.super_admins where user_id = p_user) then raise exception 'not for the super admin account'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf', 10)), updated_at = now()
    where id = p_user and email like '%@youth-alpha.app';
  if not found then raise exception 'not an app login'; end if;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, new_data)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'staff', 'PASSWORD', p_user::text, jsonb_build_object('password_changed', true));
end; $$;
revoke all on function public.admin_password(uuid, text) from public, anon;
grant execute on function public.admin_password(uuid, text) to authenticated;

-- ---------- who is online (admin pages send a ping about every 45 s)
create or replace function public.admin_ping(p_program int, p_page text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then return; end if;
  insert into public.admin_presence (user_id, program_id, page, seen_at) values (auth.uid(), p_program, left(coalesce(p_page, ''), 40), now())
  on conflict (user_id) do update set program_id = excluded.program_id, page = excluded.page, seen_at = now();
end; $$;
revoke all on function public.admin_ping(int, text) from public, anon;
grant execute on function public.admin_ping(int, text) to authenticated;

create or replace function public.admin_online() returns json
language plpgsql stable security definer set search_path = public, private as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  return coalesce((select json_agg(x order by x.seen_at desc) from (
    select a.user_id, a.program_id, a.page, a.seen_at,
      exists (select 1 from private.super_admins s where s.user_id = a.user_id) as is_super,
      coalesce(nullif(st.display_name, ''), (select username from private.super_admins s where s.user_id = a.user_id), split_part(u.email, '@', 1)) as name
    from public.admin_presence a join auth.users u on u.id = a.user_id left join public.staff st on st.user_id = a.user_id
    where a.seen_at > now() - interval '10 minutes') x), '[]'::json);
end; $$;
revoke all on function public.admin_online() from public, anon;
grant execute on function public.admin_online() to authenticated;
