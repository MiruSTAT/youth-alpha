-- =====================================================================
-- 019  v28 — program settings (programs.look)
--   programs.look (jsonb, added in 018) now holds each program's settings,
--   set only by the super admin on the super admin page:
--     { "title": "Easter Kids", "emoji": "🐣", "pack": "christmas|plain|easter",
--       "font": "noto|sarabun|kanit|mitr|prompt", "size": 0.9..1.3,
--       "off": { "songs": true, "shop": true, "feedback": true, "bible": true,
--                "santa": true, "festive": true, "snow": true, "tree": true, "music": true },
--       "words": { "th": { "<i18n key>": "text" }, "en": { … } } }
--   Missing keys = the normal app (nothing switched off). Every change is kept
--   in audit_log by the audit_programs trigger from 018. Nothing is deleted.
-- =====================================================================
create or replace function public.program_set_look(p_id int, p_look jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_superadmin() then raise exception 'super admin only'; end if;
  if p_look is null or jsonb_typeof(p_look) <> 'object' then raise exception 'look must be an object'; end if;
  if length(p_look::text) > 20000 then raise exception 'look too big'; end if;
  update public.programs set look = p_look where id = p_id;
  if not found then raise exception 'no such program'; end if;
end; $$;
revoke all on function public.program_set_look(int, jsonb) from public, anon;
grant execute on function public.program_set_look(int, jsonb) to authenticated;
