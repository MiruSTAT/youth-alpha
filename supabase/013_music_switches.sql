-- =====================================================================
-- Youth Alpha — update 13: admin on/off switches for every music feature. Safe to re-run.
--  settings.music = { bgMusic, songsTab, festive, festiveSfx, video, metro, beatDots, scroll, speed,
--                     beatSync, lineSync, chords, transpose, textSize, langSwitch, origSheet }  (missing = on)
-- =====================================================================
alter table public.settings add column if not exists music jsonb not null default '{}'::jsonb;

create or replace view public.event_info as
select event_dow, event_start, event_end, fb_dow, fb_start, fb_end, tip_days, fb_open, music from public.settings where id = 1;
grant select on public.event_info to anon, authenticated;
