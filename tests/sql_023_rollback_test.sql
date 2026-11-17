-- v37 rolled-back live test for supabase/023_maintenance.sql: run with
--   await QF('<commit>', 'supabase/023_maintenance.sql', 'tests/sql_023_rollback_test.sql')
-- It ends with raise exception, so nothing is kept.
do $t$
declare out text := ''; n int; adm uuid; su uuid; sid uuid := gen_random_uuid(); m jsonb;
begin
  out := 'start on=' || public.in_maintenance(1);

  -- anon may not switch it
  perform set_config('role', 'anon', true);
  begin perform public.program_set_maintenance(1, true, 'tree'); out := out || ' | anonSwitch=ALLOWED'; exception when others then out := out || ' | anonSwitch=refused'; end;
  perform set_config('role', 'postgres', true);

  -- a normal admin may not switch it either
  select sp.user_id into adm from public.staff_programs sp join public.staff s on s.user_id = sp.user_id
   where sp.program_id = 1 and s.active and cardinality(sp.perms) > 0 limit 1;
  if adm is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    begin perform public.program_set_maintenance(1, true, 'tree'); out := out || ' adminSwitch=ALLOWED'; exception when others then out := out || ' adminSwitch=refused'; end;
    out := out || ' adminCanBefore=' || public.can(1, 'points');
    perform set_config('role', 'postgres', true);
  else out := out || ' (no normal admin)'; end if;

  -- the super admin switches it on (as the app does)
  select user_id into su from private.super_admins limit 1;
  insert into private.super_sessions (session_id, user_id, until) values (sid, su, now() + interval '1 hour');
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.program_set_maintenance(1, true, 'bunny');
  perform set_config('role', 'postgres', true);
  select maintenance into m from public.programs where id = 1;
  out := out || ' | superOn=' || m::text || ' in=' || public.in_maintenance(1) || ' other=' || coalesce((select bool_or(public.in_maintenance(id)) from public.programs where id <> 1), false);

  -- a kid (anon) cannot write: activity log, feedback
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  begin insert into public.kid_events (device_id, event, detail, path, program_id) values ('t023testdevice000000', 'open_app', 'test', '#/', 1); out := out || ' | kidLog=ALLOWED'; exception when others then out := out || ' | kidLog=refused(' || left(sqlerrm, 40) || ')'; end;
  begin insert into public.feedback (mood, message, program_id) values (3, 'test', 1); out := out || ' kidFb=ALLOWED'; exception when others then out := out || ' kidFb=refused(' || left(sqlerrm, 40) || ')'; end;
  perform set_config('role', 'postgres', true);

  -- a normal admin: no permissions, no writes
  if adm is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    out := out || ' | adminCan=' || public.can(1, 'points');
    begin update public.settings set tip_days = tip_days where id = 1; get diagnostics n = row_count; out := out || ' adminWrite=' || n || 'rows'; exception when others then out := out || ' adminWrite=refused(' || left(sqlerrm, 40) || ')'; end;
    perform set_config('role', 'postgres', true);
  end if;

  -- the super admin still writes
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  begin update public.settings set tip_days = tip_days where id = 1; get diagnostics n = row_count; out := out || ' | superWrite=' || n || 'rows'; exception when others then out := out || ' | superWrite=refused ' || sqlerrm; end;
  perform public.program_set_maintenance(1, false, 'tree');
  perform set_config('role', 'postgres', true);
  out := out || ' superOff in=' || public.in_maintenance(1);

  -- off again: a kid can write
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  begin insert into public.kid_events (device_id, event, detail, path, program_id) values ('t023testdevice000000', 'view', 'test', '#/', 1); out := out || ' | kidLogAfter=ok'; exception when others then out := out || ' | kidLogAfter=REFUSED ' || sqlerrm; end;
  perform set_config('role', 'postgres', true);

  raise exception 'TEST RESULT: %', out;
end $t$;
