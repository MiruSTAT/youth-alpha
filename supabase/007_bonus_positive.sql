-- =====================================================================
-- Youth Alpha — update 7: bonus points can never be negative. Safe to re-run.
-- =====================================================================
alter table public.points drop constraint if exists bonus_positive;
alter table public.points add constraint bonus_positive check (skill <> 'bonus' or amount > 0);
