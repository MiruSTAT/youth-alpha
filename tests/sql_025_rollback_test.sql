-- v41 rolled-back live test for supabase/025_sold_out.sql: run with
--   await QF('<commit>', 'supabase/025_sold_out.sql', 'tests/sql_025_rollback_test.sql')
-- It ends with raise exception, so nothing is kept.
do $t$
declare out text := ''; n int; nf int; it uuid; b boolean;
begin
  select count(*), count(*) filter (where sold_out) into n, nf from public.shop_items;
  out := out || 'items=' || n || ' soldOutAtStart=' || nf;
  select id into it from public.shop_items limit 1;
  if it is not null then
    update public.shop_items set sold_out = true where id = it;
    select sold_out into b from public.shop_items where id = it; out := out || ' | setTrue=' || b;
    -- anyone (anon) can still read the column, as the kids' shop needs it
    perform set_config('role', 'anon', true);
    begin select count(*) into n from public.shop_items where sold_out; out := out || ' anonRead=ok(' || n || ')';
    exception when others then out := out || ' anonRead=REFUSED ' || sqlerrm; end;
    perform set_config('role', 'postgres', true);
  else out := out || ' | (no prize to test with)'; end if;
  raise exception 'TEST RESULT: %', out;
end $t$;
