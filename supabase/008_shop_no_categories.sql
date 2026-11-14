-- =====================================================================
-- Youth Alpha — update 8: prizes no longer need a shop category. Safe to re-run.
-- =====================================================================
alter table public.shop_items alter column category_id drop not null;
