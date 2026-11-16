-- =====================================================================
-- Youth Alpha — update 17: super admin with two-step sign-in. Safe to re-run.
--
-- How it works
--  * The super admin is a normal Supabase login whose email is the owner's own address. That login has NO
--    Supabase password: the only way into it is a sign-in link emailed to the owner (step 2).
--  * The super admin's own username + password (step 1) live in private.super_admins, hashed with bcrypt.
--    (Kept here, not in Supabase Auth, so the owner chooses any password; Supabase needs 6+ characters.)
--  * Step 1: superadmin_start(username, password) checks the password (5 wrong tries = 15 minute lock)
--    and returns the email to send the link to. Step 2: the owner opens the emailed link; that signs the
--    device in. Then superadmin_unlock() checks that the link was opened AFTER the password was right
--    (within 20 minutes) and unlocks THIS sign-in session for 12 hours.
--  * is_superadmin() is true only for an unlocked session. is_staff() / is_admin() also return true for it,
--    so the super admin can use every admin page.
--  * The owner's email is NOT in this file (the repository is public). It is stored once, by hand, in
--    private.owner from the SQL editor:  insert into private.owner(id, email) values (1, '<email>')
--    on conflict (id) do update set email = excluded.email;
--  * First time: the owner gets an invitation email (Supabase dashboard → Authentication → Users →
--    Invite user), opens it, and the app shows the set-up page (choose username + password), which calls
--    superadmin_claim(). That only works while there is no super admin yet, and only for the owner's email.
-- =====================================================================
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.owner (
  id    int primary key default 1 check (id = 1),
  email text not null
);
create table if not exists private.super_admins (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique check (username ~ '^[A-Za-z0-9_.-]{2,30}$'),
  pw_hash      text not null,
  failed       int  not null default 0,
  locked_until timestamptz,
  pw_ok_at     timestamptz,                 -- when step 1 last succeeded (used once by superadmin_unlock)
  created_at   timestamptz not null default now()
);
create table if not exists private.super_sessions (
  session_id uuid primary key,              -- Supabase sign-in session (JWT claim session_id)
  user_id    uuid not null references auth.users(id) on delete cascade,
  until      timestamptz not null,
  created_at timestamptz not null default now()
);
-- row level security on, no policies: nobody reads these through the API (the functions below run as the owner)
alter table private.owner enable row level security;
alter table private.super_admins enable row level security;
alter table private.super_sessions enable row level security;

-- ---------- who is what
create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public, private as $$
  select exists (
    select 1 from private.super_sessions s join private.super_admins a on a.user_id = s.user_id
    where s.user_id = auth.uid() and s.until > now()
      and s.session_id::text = coalesce(auth.jwt()->>'session_id', ''));
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid()) or public.is_superadmin();
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin') or public.is_superadmin();
$$;

-- 'superadmin' (unlocked) | 'superlocked' (super admin, needs both steps) | 'superclaim' (owner, no super admin yet)
-- | 'admin' | 'editor' | 'pending' | null (not signed in)
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public, private as $$
  select case
    when auth.uid() is null then null
    when public.is_superadmin() then 'superadmin'
    when exists (select 1 from private.super_admins where user_id = auth.uid()) then 'superlocked'
    when not exists (select 1 from private.super_admins)
      and exists (select 1 from private.owner o join auth.users u on lower(u.email) = lower(o.email) where u.id = auth.uid()) then 'superclaim'
    else coalesce((select role from public.staff where user_id = auth.uid()), 'pending')
  end;
$$;

-- ---------- step 1: username + password (anyone may call it; slowed down and locked after 5 wrong tries)
create or replace function public.superadmin_start(p_username text, p_password text) returns json
language plpgsql security definer set search_path = public, private, extensions as $$
declare a private.super_admins; em text;
begin
  perform pg_sleep(0.4);
  select * into a from private.super_admins where lower(username) = lower(btrim(coalesce(p_username, '')));
  if not found then return json_build_object('ok', false, 'reason', 'wrong'); end if;
  if a.locked_until is not null and a.locked_until > now() then
    return json_build_object('ok', false, 'reason', 'locked', 'minutes', ceil(extract(epoch from a.locked_until - now()) / 60));
  end if;
  if extensions.crypt(coalesce(p_password, ''), a.pw_hash) <> a.pw_hash then
    update private.super_admins
      set failed = case when failed + 1 >= 5 then 0 else failed + 1 end,
          locked_until = case when failed + 1 >= 5 then now() + interval '15 minutes' else locked_until end
      where user_id = a.user_id;
    return json_build_object('ok', false, 'reason', 'wrong');
  end if;
  update private.super_admins set failed = 0, locked_until = null, pw_ok_at = now() where user_id = a.user_id;
  select email into em from auth.users where id = a.user_id;
  return json_build_object('ok', true, 'email', em);
end; $$;
revoke all on function public.superadmin_start(text, text) from public;
grant execute on function public.superadmin_start(text, text) to anon, authenticated;

-- ---------- step 2 done: unlock this sign-in session (the link must have been opened after step 1)
create or replace function public.superadmin_unlock() returns json
language plpgsql security definer set search_path = public, private as $$
declare a private.super_admins; signed_in bigint; sid text := coalesce(auth.jwt()->>'session_id', '');
begin
  select * into a from private.super_admins where user_id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'not_super'); end if;
  if sid = '' then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  if a.pw_ok_at is null or a.pw_ok_at < now() - interval '20 minutes' then return json_build_object('ok', false, 'reason', 'need_password'); end if;
  select max((x->>'timestamp')::bigint) into signed_in from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) x;
  if signed_in is null or signed_in < extract(epoch from a.pw_ok_at)::bigint - 5 then
    return json_build_object('ok', false, 'reason', 'old_link');
  end if;
  insert into private.super_sessions (session_id, user_id, until) values (sid::uuid, a.user_id, now() + interval '12 hours')
    on conflict (session_id) do update set until = excluded.until;
  update private.super_admins set pw_ok_at = null where user_id = a.user_id;
  return json_build_object('ok', true, 'until', now() + interval '12 hours', 'username', a.username);
end; $$;
revoke all on function public.superadmin_unlock() from public, anon;
grant execute on function public.superadmin_unlock() to authenticated;

-- ---------- first time only: the owner (signed in from the invitation email) sets username + password
create or replace function public.superadmin_claim(p_username text, p_password text) returns json
language plpgsql security definer set search_path = public, private, extensions as $$
declare sid text := coalesce(auth.jwt()->>'session_id', ''); u text := btrim(coalesce(p_username, ''));
begin
  if auth.uid() is null or sid = '' then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  if exists (select 1 from private.super_admins) then return json_build_object('ok', false, 'reason', 'exists'); end if;
  if not exists (select 1 from private.owner o join auth.users x on lower(x.email) = lower(o.email) where x.id = auth.uid()) then
    return json_build_object('ok', false, 'reason', 'not_owner');
  end if;
  if u !~ '^[A-Za-z0-9_.-]{2,30}$' then return json_build_object('ok', false, 'reason', 'bad_username'); end if;
  if char_length(coalesce(p_password, '')) < 4 then return json_build_object('ok', false, 'reason', 'short_password'); end if;
  insert into private.super_admins (user_id, username, pw_hash) values (auth.uid(), u, extensions.crypt(p_password, extensions.gen_salt('bf', 10)));
  insert into private.super_sessions (session_id, user_id, until) values (sid::uuid, auth.uid(), now() + interval '12 hours')
    on conflict (session_id) do update set until = excluded.until;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, new_data)
    values (auth.uid(), '', 'super_admins', 'INSERT', u, jsonb_build_object('username', u));
  return json_build_object('ok', true, 'username', u);
end; $$;
revoke all on function public.superadmin_claim(text, text) from public, anon;
grant execute on function public.superadmin_claim(text, text) to authenticated;

-- ---------- lock again (sign-out of super admin powers on this session)
create or replace function public.superadmin_lock() returns void
language sql security definer set search_path = public, private as $$
  delete from private.super_sessions where user_id = auth.uid() and session_id::text = coalesce(auth.jwt()->>'session_id', '');
$$;
revoke all on function public.superadmin_lock() from public, anon;
grant execute on function public.superadmin_lock() to authenticated;

-- ---------- details for the super admin page
create or replace function public.superadmin_info() returns json
language sql stable security definer set search_path = public, private as $$
  select case when not public.is_superadmin() then null else json_build_object(
    'username', (select username from private.super_admins where user_id = auth.uid()),
    'until', (select until from private.super_sessions where user_id = auth.uid() and session_id::text = coalesce(auth.jwt()->>'session_id', '')))
  end;
$$;
revoke all on function public.superadmin_info() from public, anon;
grant execute on function public.superadmin_info() to authenticated;

-- ---------- settings only the super admin may change (whitelisted keys)
create or replace function public.superadmin_set(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if p_key = 'install_on' then update public.settings set install_on = (p_value #>> '{}')::boolean where id = 1;
  else raise exception 'unknown setting %', p_key; end if;
end; $$;
revoke all on function public.superadmin_set(text, jsonb) from public, anon;
grant execute on function public.superadmin_set(text, jsonb) to authenticated;

-- only the super admin may change these settings, even though admins can update the settings row
create or replace function public.settings_super_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.install_on is distinct from old.install_on and not public.is_superadmin() then
    raise exception 'only the super admin can change install_on';
  end if;
  return new;
end; $$;
drop trigger if exists settings_super_guard on public.settings;
create trigger settings_super_guard before update on public.settings
for each row execute function public.settings_super_guard();

-- clearing the kids' activity log: the super admin re-enters THEIR password (checked by superadmin_start
-- in the last 2 minutes) instead of a Supabase password, which their login does not have
create or replace function public.clear_kid_events() returns int
language plpgsql security definer set search_path = public, private as $$
declare cnt int;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if coalesce((auth.jwt()->>'iat')::bigint, 0) < extract(epoch from now())::bigint - 120
     and not exists (select 1 from private.super_admins where user_id = auth.uid() and pw_ok_at > now() - interval '2 minutes') then
    raise exception 'please re-enter the admin password';
  end if;
  delete from public.kid_events;
  get diagnostics cnt = row_count;
  update private.super_admins set pw_ok_at = null where user_id = auth.uid();
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, new_data)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'kid_events', 'CLEAR', '', jsonb_build_object('rows_deleted', cnt));
  return cnt;
end; $$;
revoke all on function public.clear_kid_events() from public, anon;
grant execute on function public.clear_kid_events() to authenticated;
