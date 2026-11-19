-- v39 rolled-back live test for supabase/024_staff_events.sql: run with
--   await QF('<commit>', 'supabase/024_staff_events.sql', 'tests/sql_024_rollback_test.sql')
-- It ends with raise exception, so nothing is kept.
do $t$
declare out text := ''; v0 bigint; v1 bigint; v2 bigint; v3 bigint; n int; st uuid; b boolean; dev text := 't024testdevice000000';
begin
  insert into public.home_counters (program_id, visits) values (1, 0) on conflict (program_id) do nothing;
  select visits into v0 from public.home_counters where program_id = 1; out := out || 'start=' || v0;

  -- a kid (anon) opens the app; trying to claim by_staff = true is overruled by the trigger
  perform set_config('role', 'anon', true);
  insert into public.kid_events (device_id, event, detail, path, program_id, by_staff) values (dev, 'open_app', 'test', '#/', 1, true);
  insert into public.kid_events (device_id, event, detail, path, program_id) values (dev, 'view', 'menu', '#/menu', 1);
  begin perform public.mark_staff_device(dev, 1); out := out || ' anonMark=ALLOWED'; exception when others then out := out || ' anonMark=refused'; end;
  perform set_config('role', 'postgres', true);
  select bool_or(by_staff) into b from public.kid_events where device_id = dev; out := out || ' | kidRowsStaff=' || b;
  select visits into v1 from public.home_counters where program_id = 1; out := out || ' visitsAfterKid=+' || (v1 - v0);

  -- an admin signs in on that phone: the last 10 minutes get marked, the visit is taken back
  select user_id into st from public.staff limit 1;
  if st is null then out := out || ' | (no staff account to test with)'; else
    perform set_config('request.jwt.claims', json_build_object('sub', st, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select public.mark_staff_device(dev, 1) into n; out := out || ' | marked=' || n;
    insert into public.kid_events (device_id, event, detail, path, program_id) values (dev, 'open_app', 'test', '#/', 1);
    perform set_config('role', 'postgres', true);
    select bool_and(by_staff) into b from public.kid_events where device_id = dev; out := out || ' allStaff=' || b;
    select visits into v2 from public.home_counters where program_id = 1; out := out || ' visitsNow=+' || (v2 - v0);
    begin
      select (public.kid_week_stats(1, now() - interval '1 minute')->>'phones')::int into n;
      out := out || ' weekPhones=' || n || ' (expected ' || (select count(distinct device_id) from public.kid_events where program_id = 1 and created_at > now() - interval '1 minute' and not by_staff) || ')';
    exception when others then out := out || ' weekPhones=error ' || sqlerrm; end;
  end if;
  select count(*) into n from public.kid_events where by_staff and device_id <> dev; out := out || ' | oldRowsMarked=' || n;
  raise exception 'TEST RESULT: %', out;
end $t$;
