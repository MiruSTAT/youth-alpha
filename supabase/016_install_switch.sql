-- =====================================================================
-- Youth Alpha — update 16: "Install the app" option in the kids' menu. OFF by default;
-- the super admin page (v25) gets the switch. Safe to re-run.
-- =====================================================================
alter table public.settings add column if not exists install_on boolean not null default false;

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music, announce, verse_text, verse_ref, install_on
from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;
