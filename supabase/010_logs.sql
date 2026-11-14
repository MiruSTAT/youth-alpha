-- =====================================================================
-- Youth Alpha — update 10: logs. Safe to re-run.
--  * audit_log  : every add / change / delete made by admins. PERMANENT — can never be edited or deleted.
--  * kid_events : what kids tap/view (for later analysis). Can only be cleared by an admin who has
--                 just re-entered their password (checked on the server), and the clearing is logged.
-- =====================================================================

-- ---------- Admin change log (permanent)
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  actor       uuid,
  actor_email text not null default '',
  table_name  text not null,
  op          text not null,
  row_key     text not null default '',
  old_data    jsonb,
  new_data    jsonb
);
create index if not exists audit_log_time_idx on public.audit_log(created_at);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
drop policy if exists staff_read on public.audit_log;
create policy staff_read on public.audit_log for select to authenticated using (public.is_staff());

-- block any edit / delete / truncate of the log, for everyone
create or replace function public.audit_log_protect() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is permanent and cannot be changed or deleted';
end; $$;
drop trigger if exists audit_log_no_change on public.audit_log;
create trigger audit_log_no_change before update or delete on public.audit_log
for each row execute function public.audit_log_protect();
drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate before truncate on public.audit_log
for each statement execute function public.audit_log_protect();

-- record every change on the admin-managed tables
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  k text  := coalesce(n->>'id', o->>'id', n->>'key', o->>'key', n->>'user_id', o->>'user_id', n->>'day', o->>'day', '');
begin
  if TG_OP = 'UPDATE' and o = n then return null; end if;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, old_data, new_data)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), TG_TABLE_NAME, TG_OP, k, o, n);
  return null;
end; $$;

do $$
declare t text;
begin
  foreach t in array array['kids', 'points', 'attendance', 'attendance_rounds', 'shop_items', 'point_categories', 'settings', 'staff'] loop
    execute format('drop trigger if exists audit_%s on public.%I', t, t);
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- ---------- Kid activity log
create table if not exists public.kid_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  device_id  text not null check (char_length(device_id) between 6 and 64),
  kid_id     uuid,
  event      text not null check (event ~ '^[a-z_]{1,40}$'),
  detail     text not null default '' check (char_length(detail) <= 120),
  path       text not null default '' check (char_length(path) <= 60)
);
create index if not exists kid_events_time_idx on public.kid_events(created_at);
alter table public.kid_events enable row level security;
revoke all on public.kid_events from anon, authenticated;
grant insert on public.kid_events to anon, authenticated;
grant select on public.kid_events to authenticated;
drop policy if exists anyone_insert on public.kid_events;
drop policy if exists staff_read on public.kid_events;
create policy anyone_insert on public.kid_events for insert to anon, authenticated with check (true);
create policy staff_read on public.kid_events for select to authenticated using (public.is_staff());

-- the ONLY way to clear kid logs: admin, password re-entered in the last 2 minutes
create or replace function public.clear_kid_events() returns int
language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if coalesce((auth.jwt()->>'iat')::bigint, 0) < extract(epoch from now())::bigint - 120 then
    raise exception 'please re-enter the admin password';
  end if;
  delete from public.kid_events;
  get diagnostics cnt = row_count;
  insert into public.audit_log (actor, actor_email, table_name, op, row_key, new_data)
  values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'kid_events', 'CLEAR', '', jsonb_build_object('rows_deleted', cnt));
  return cnt;
end; $$;
revoke all on function public.clear_kid_events() from public, anon;
grant execute on function public.clear_kid_events() to authenticated;
