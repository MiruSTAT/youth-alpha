-- v32 rolled-back live test for supabase/021_admin_access.sql: send the 021 file text + this block as ONE query
-- (see HANDOFF.md "Running SQL from the browser"). It ends with raise exception, so nothing is kept.
do $t$
declare
  su uuid; adm uuid; nid uuid; sid uuid := gen_random_uuid(); kid uuid; kid3 uuid; out text := ''; n int; j json; ok boolean; out2 text;
begin
  select user_id into su from private.super_admins limit 1;
  select user_id into adm from public.staff where role = 'admin' limit 1;
  select id into kid from public.kids where program_id = 1 and active limit 1;
  insert into private.super_sessions (session_id, user_id, until) values (sid, su, now() + interval '1 hour');

  -- act as super
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  out := out || 'super role=' || public.my_role();
  nid := public.admin_create('t2a-tester', 'secret123', 'Tester');
  perform public.admin_save(nid, 'Tester', true, '{"1": ["points"]}'::jsonb);
  select json_array_length(public.admin_list()) into n; out := out || ' list=' || n;
  select count(*) into n from public.audit_log; out := out || ' superAudit=' || n;
  select count(*) into n from public.kids where program_id = 3; out := out || ' superKids3=' || n;
  begin perform public.admin_save(su, 'x', true, '{}'::jsonb); out := out || ' saveSuper=ALLOWED'; exception when others then out := out || ' saveSuper=refused'; end;

  -- act as the new tester (points only, program 1)
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', nid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  out := out || ' | tester role=' || public.my_role() || ' access=' || public.my_access()::text;
  select count(*) into n from public.kids where program_id = 1; out := out || ' kids1=' || n;
  select count(*) into n from public.kids where program_id = 3; out := out || ' kids3=' || n;
  begin insert into public.points (kid_id, skill, amount, note) values (kid, 'bonus', 5, 't2a'); out := out || ' givePts=ok';
  exception when others then out := out || ' givePts=FAIL:' || sqlerrm; end;
  update public.kids set nickname = nickname where program_id = 1; get diagnostics n = row_count; out := out || ' kidUpd=' || n;
  begin insert into public.shop_items (name, icon, price, program_id) values ('x', '🎁', 1, 1); out := out || ' shopIns=ALLOWED'; exception when others then out := out || ' shopIns=refused'; end;
  select count(*) into n from public.audit_log; out := out || ' audit=' || n;
  select count(*) into n from public.kid_events; out := out || ' kev=' || n;
  select count(*) into n from public.feedback; out := out || ' fb=' || n;
  begin update public.settings set tip_days = tip_days + 1 where id = 1; get diagnostics n = row_count; out := out || ' setUpd=ALLOWED' || n; exception when others then out := out || ' setUpd=refused'; end;
  begin j := public.kid_week_stats(1, now() - interval '7 days'); out := out || ' wk1=ok'; exception when others then out := out || ' wk1=FAIL:' || sqlerrm; end;
  begin j := public.kid_week_stats(3, now() - interval '7 days'); out := out || ' wk3=ALLOWED'; exception when others then out := out || ' wk3=refused'; end;
  begin perform public.save_notice('x', '', '', 1); out := out || ' notice=ALLOWED'; exception when others then out := out || ' notice=refused'; end;
  begin perform public.member_list(1); out := out || ' members=ALLOWED'; exception when others then out := out || ' members=refused'; end;
  begin j := public.admin_list(); out := out || ' adminList=ALLOWED'; exception when others then out := out || ' adminList=refused'; end;
  perform public.admin_ping(1, 'points');

  -- existing admin (full rights on program 1)
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  out := out || ' | admin role=' || public.my_role() || ' access=' || public.my_access()::text;
  begin update public.settings set tip_days = tip_days where id = 1; update public.settings set fb_open = fb_open where id = 1; out := out || ' setUpd=ok'; exception when others then out := out || ' setUpd=FAIL:' || sqlerrm; end;
  begin update public.settings set install_on = not install_on where id = 1; out := out || ' install=ALLOWED'; exception when others then out := out || ' install=refused'; end;
  select count(*) into n from public.feedback where program_id = 1; out := out || ' fb=' || n;
  select count(*) into n from public.kids where program_id = 3; out := out || ' kids3=' || n;
  select count(*) into n from public.audit_log; out := out || ' audit=' || n;
  begin perform public.member_list(1); out := out || ' members=ok'; exception when others then out := out || ' members=FAIL'; end;
  begin perform public.save_notice((select announce from public.settings where id = 1), (select verse_text from public.settings where id = 1), (select verse_ref from public.settings where id = 1), 1); out := out || ' notice=ok'; exception when others then out := out || ' notice=FAIL:' || sqlerrm; end;
  begin j := public.admin_online(); out := out || ' online=ALLOWED'; exception when others then out := out || ' online=refused'; end;

  -- super: switch tester off, online list, audit rows have program ids
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', su, 'role', 'authenticated', 'session_id', sid)::text, true);
  perform set_config('role', 'authenticated', true);
  out := out || ' | online=' || json_array_length(public.admin_online());
  perform public.admin_save(nid, 'Tester', false, '{"1": ["points"]}'::jsonb);
  perform public.admin_password(nid, 'another1');
  select count(*) into n from public.audit_log where created_at > now() - interval '1 minute' and program_id = 1; out := out || ' newAuditP1=' || n;
  select string_agg(table_name || ':' || op || ':' || coalesce(program_id::text, '-'), ',') into out2 from (select * from public.audit_log where created_at >= now() order by id) z;
  out := out || ' rows=' || coalesce(out2, '');
  -- tester switched off
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', nid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  out := out || ' | off role=' || public.my_role();
  select count(*) into n from public.kids; out := out || ' kids=' || n;
  -- visitors
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  select count(*) into n from public.leaderboard where program_id = 1; out := out || ' | anon lb=' || n;
  select count(*) into n from public.songs where program_id = 1; out := out || ' songs=' || n;
  select count(*) into n from public.shop_items where program_id = 1; out := out || ' shop=' || n;
  raise exception 'TEST RESULT: %', out;
end $t$;
