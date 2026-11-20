-- v46 rolled-back live test for supabase/026_maint_timer.sql: run with
--   await QF('<commit>', 'supabase/026_maint_timer.sql', 'tests/sql_026_rollback_test.sql')
-- It ends with raise exception, so nothing is kept.
do $t$
declare out text := ''; su uuid; sid uuid := gen_random_uuid(); m jsonb;
begin
  out := 'start in=' || public.in_maintenance(1);

  -- anon may not use the new form
  perform set_config('role', 'anon', true);
  begin perform public.program_set_maintenance(1, true, 'tree', 30); out := out || ' | anon=ALLOWED'; exception when others then out := out || ' | anon=refused'; end;
  perform set_config('role', 'postgres', true);

  -- the super admin: 30-minute timer
  select user_id into su from private.super_admins limit 1;
  insert into private.super_sessions (session_id, user_id, until) values (sid, su, now() + interval '1 hour');
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.program_set_maintenance(1, true, 'tree', 30);
  perform set_config('role', 'postgres', true);
  select maintenance into m from public.programs where id = 1;
  out := out || ' | timer30 until-at=' || round(extract(epoch from ((m->>'until')::timestamptz - (m->>'at')::timestamptz)) / 60) || 'min in=' || public.in_maintenance(1);

  -- the time has passed (moved back by hand): no longer in maintenance, a kid can write again
  update public.programs set maintenance = maintenance || jsonb_build_object('until', now() - interval '1 minute') where id = 1;
  out := out || ' | passed in=' || public.in_maintenance(1);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  begin insert into public.kid_events (device_id, event, detail, path, program_id) values ('t026testdevice000000', 'view', 'test', '#/', 1); out := out || ' kidLog=ok'; exception when others then out := out || ' kidLog=REFUSED ' || left(sqlerrm, 40); end;
  perform set_config('role', 'postgres', true);

  -- old 3-argument form = no timer; too long is refused; switching off clears until
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.program_set_maintenance(1, true, 'bunny');
  select maintenance into m from public.programs where id = 1;
  out := out || ' | old3 until=' || coalesce(m->>'until', 'null') || ' in=' || public.in_maintenance(1);
  begin perform public.program_set_maintenance(1, true, 'tree', 20000); out := out || ' | tooLong=ALLOWED'; exception when others then out := out || ' | tooLong=refused'; end;
  perform public.program_set_maintenance(1, false, 'tree', 30);
  perform set_config('role', 'postgres', true);
  select maintenance into m from public.programs where id = 1;
  out := out || ' | off until=' || coalesce(m->>'until', 'null') || ' in=' || public.in_maintenance(1);

  raise exception 'TEST RESULT: %', out;
end $t$;
