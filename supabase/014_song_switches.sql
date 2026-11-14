-- Youth Alpha — update 14: per-song on/off switches for what kids see (beat dots, original sheet, …). Safe to re-run.
alter table public.songs add column if not exists opts jsonb not null default '{}'::jsonb;
