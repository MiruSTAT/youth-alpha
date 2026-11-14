-- =====================================================================
-- Youth Alpha — update 2: schedule + points shop
-- Run once in Supabase > SQL Editor (safe to re-run).
-- =====================================================================

-- Schedule (everyone can read; staff edit)
create table if not exists public.schedule (
  id         uuid primary key default gen_random_uuid(),
  day        date not null,
  time_text  text not null default '',
  title      text not null check (char_length(title) between 1 and 80),
  note       text not null default '',
  created_at timestamptz not null default now()
);

-- Shop categories, e.g. Toys (bunny pops out), Snacks (chips fly out)
create table if not exists public.shop_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  icon       text not null default '🎁',      -- what sits on the shelf
  effect     text not null default '✨',      -- what flies out when tapped
  sort       int  not null default 0,
  created_at timestamptz not null default now()
);

-- Shop items with a price in points
create table if not exists public.shop_items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.shop_categories(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  icon        text not null default '🎁',
  price       int  not null check (price between 0 and 100000),
  active      boolean not null default true,
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists shop_items_cat_idx on public.shop_items(category_id);

alter table public.schedule        enable row level security;
alter table public.shop_categories enable row level security;
alter table public.shop_items      enable row level security;

grant select on public.schedule, public.shop_categories, public.shop_items to anon, authenticated;

drop policy if exists public_read on public.schedule;
drop policy if exists public_read on public.shop_categories;
drop policy if exists public_read on public.shop_items;
create policy public_read on public.schedule        for select to anon, authenticated using (true);
create policy public_read on public.shop_categories for select to anon, authenticated using (true);
create policy public_read on public.shop_items      for select to anon, authenticated using (active or public.is_staff());

do $$
declare t text;
begin
  foreach t in array array['schedule','shop_categories','shop_items'] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated
                    using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- The two categories from the brief (only added if the shop is empty). Edit freely in the app.
insert into public.shop_categories (name, icon, effect, sort)
select * from (values ('ของเล่น', '🐰', '✨', 1), ('ขนม', 'chipbag', 'chips', 2)) v(name, icon, effect, sort)
where not exists (select 1 from public.shop_categories);
