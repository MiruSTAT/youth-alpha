-- =====================================================================
-- Youth Alpha — update 15: prize redemption, announcement line, verse of the week. Safe to re-run.
--  * redemptions : a prize given to a kid. The price comes off the kid's "points to spend";
--                  the ranking total (sum of points) does not change.
--  * settings.announce / verse_text / verse_ref : shown on the kids' home page.
-- =====================================================================

-- ---------- Prizes given
create table if not exists public.redemptions (
  id         uuid primary key default gen_random_uuid(),
  kid_id     uuid not null references public.kids(id) on delete cascade,
  item_id    uuid references public.shop_items(id) on delete set null,
  item_name  text not null check (char_length(item_name) between 1 and 40),
  item_icon  text not null default '🎁',
  price      int  not null check (price between 0 and 100000),
  note       text not null default '' check (char_length(note) <= 80),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists redemptions_kid_idx on public.redemptions(kid_id);
alter table public.redemptions enable row level security;
revoke all on public.redemptions from anon, authenticated;
grant select, insert, delete on public.redemptions to authenticated;
drop policy if exists staff_all on public.redemptions;
create policy staff_all on public.redemptions for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- a prize can only be given when the kid has enough points left to spend (checked on the server)
create or replace function public.redeem_check() returns trigger
language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  select coalesce((select sum(amount) from public.points where kid_id = new.kid_id), 0)
       - coalesce((select sum(price) from public.redemptions where kid_id = new.kid_id), 0) into bal;
  if new.price > bal then raise exception 'not enough points to spend'; end if;
  new.created_by := auth.uid();
  return new;
end; $$;
drop trigger if exists redeem_check_trg on public.redemptions;
create trigger redeem_check_trg before insert on public.redemptions
for each row execute function public.redeem_check();

drop trigger if exists audit_redemptions on public.redemptions;
create trigger audit_redemptions after insert or update or delete on public.redemptions
for each row execute function public.audit_trigger();

-- public leaderboard: + "spent" (points already traded for prizes). Still nickname / avatar / points only.
create or replace view public.leaderboard as
select k.id, k.nickname, k.avatar,
  coalesce((select sum(p.amount) from public.points p where p.kid_id = k.id), 0)::int as total,
  coalesce((select sum(r.price) from public.redemptions r where r.kid_id = k.id), 0)::int as spent
from public.kids k
where k.active;
grant select on public.leaderboard to anon, authenticated;

-- ---------- Announcement line + verse of the week
alter table public.settings add column if not exists announce   text not null default '' check (char_length(announce) <= 160);
alter table public.settings add column if not exists verse_text text not null default '' check (char_length(verse_text) <= 400);
alter table public.settings add column if not exists verse_ref  text not null default '' check (char_length(verse_ref) <= 60);

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music, announce, verse_text, verse_ref
from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;

-- admins and editors can both change these (other settings stay admin-only); the change is logged as usual
create or replace function public.save_notice(p_announce text, p_verse_text text, p_verse_ref text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  update public.settings set announce = left(btrim(coalesce(p_announce, '')), 160),
    verse_text = left(btrim(coalesce(p_verse_text, '')), 400), verse_ref = left(btrim(coalesce(p_verse_ref, '')), 60)
  where id = 1;
end; $$;
revoke all on function public.save_notice(text, text, text) from public, anon;
grant execute on function public.save_notice(text, text, text) to authenticated;
