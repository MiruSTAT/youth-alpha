-- v36 rolled-back live test for supabase/022_home_counters.sql: run with
--   await QF('<commit>', 'supabase/022_home_counters.sql', 'tests/sql_022_rollback_test.sql')
-- It ends with raise exception, so nothing is kept.
do $t$
declare out text := ''; ev text; v0 bigint; v1 bigint; f bigint; r record; n int; pts uuid;
begin
  select visits into v0 from public.home_counters where program_id = 1;
  out := out || 'start=' || coalesce(v0::text, 'none');
  select count(*) into n from public.kid_events where program_id = 1 and event = 'open_app'; out := out || ' logOpens=' || n;

  -- switches off: no numbers for anyone
  perform set_config('role', 'anon', true);
  select * into r from public.home_counts(1); out := out || ' | off: v=' || coalesce(r.visits::text, 'null') || ' f=' || coalesce(r.feedback::text, 'null');
  -- a kid opens the app (anon insert, as the app does)
  insert into public.kid_events (device_id, event, detail, path, program_id) values ('t022testdevice000000', 'open_app', 'test', '#/', 1);
  insert into public.kid_events (device_id, event, detail, path, program_id) values ('t022testdevice000000', 'view', 'test', '#/', 1);
  begin select count(*) into n from public.home_counters; out := out || ' anonRead=ALLOWED'; exception when others then out := out || ' anonRead=refused'; end;
  begin update public.settings set show_visits = true where id = 1; get diagnostics n = row_count; out := out || ' anonSwitch=' || n || 'rows'; exception when others then out := out || ' anonSwitch=refused'; end;
  perform set_config('role', 'postgres', true);
  select visits into v1 from public.home_counters where program_id = 1; out := out || ' | after open=' || v1;

  -- a staff member with only "points" may not flip the switch (settings guard)
  select user_id into pts from public.staff_programs where program_id = 1 and not ('settings' = any(perms)) and cardinality(perms) > 0 limit 1;
  if pts is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', pts, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    begin update public.settings set show_visits = true where id = 1; out := out || ' pointsOnlySwitch=ALLOWED'; exception when others then out := out || ' pointsOnlySwitch=refused'; end;
    perform set_config('role', 'postgres', true);
  else out := out || ' pointsOnlySwitch=(no such staff)'; end if;

  -- switches on
  update public.settings set show_visits = true, show_fb_count = true where id = 1;
  select count(*) into f from public.feedback where program_id = 1;
  perform set_config('role', 'anon', true);
  select * into r from public.home_counts(1); out := out || ' | on: v=' || r.visits || ' f=' || r.feedback || ' (feedback rows ' || f || ')';
  select show_visits::text || '/' || show_fb_count::text into ev from public.event_info where program_id = 1; out := out || ' eventInfo=' || ev;
  perform set_config('role', 'postgres', true);

  -- clearing the activity log does not reset the counter
  delete from public.kid_events where program_id = 1;
  select visits into v1 from public.home_counters where program_id = 1; out := out || ' | afterClear=' || v1;
  select count(*) into n from public.audit_log where table_name = 'settings' and created_at > now() - interval '1 minute'; out := out || ' settingsAudit=' || n;

  raise exception 'TEST RESULT: %', out;
end $t$;
