-- v41: a prize can be marked "sold out" (still shown in the kids' shop, greyed, and can't be redeemed).
-- Safe to re-run. No data is changed or removed; every existing prize starts as "in stock" (false).
alter table public.shop_items add column if not exists sold_out boolean not null default false;
comment on column public.shop_items.sold_out is 'v41: true = shown as "หมดแล้ว" in the shop, admins cannot redeem it';
