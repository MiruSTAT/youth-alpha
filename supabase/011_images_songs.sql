-- =====================================================================
-- Youth Alpha — update 11: uploaded pictures + songs. Safe to re-run.
--  * Storage bucket "images" (public to view, only admins/editors can upload or remove)
--  * songs : lyrics with chords, key, tempo, YouTube link, credits, sheet photos
-- =====================================================================

-- ---------- Pictures (kid avatars, prize icons, category icons, song sheets)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ya_images_insert on storage.objects;
drop policy if exists ya_images_update on storage.objects;
drop policy if exists ya_images_delete on storage.objects;
create policy ya_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_staff());
create policy ya_images_update on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_staff()) with check (bucket_id = 'images' and public.is_staff());
create policy ya_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_staff());

-- ---------- Songs
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 80),
  subtitle   text not null default '' check (char_length(subtitle) <= 80),
  song_key   text not null default '' check (char_length(song_key) <= 6),
  bpm        int  not null default 100 check (bpm between 30 and 240),
  beats      int  not null default 4 check (beats between 2 and 12),
  youtube    text not null default '' check (char_length(youtube) <= 200),
  yt_start   int  not null default 0 check (yt_start between 0 and 3600),
  credits    text not null default '' check (char_length(credits) <= 600),
  content    text not null default '' check (char_length(content) <= 20000),
  sheets     jsonb not null default '[]'::jsonb,
  sort       int  not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.songs enable row level security;
revoke all on public.songs from anon, authenticated;
grant select on public.songs to anon, authenticated;
grant insert, update, delete on public.songs to authenticated;
drop policy if exists public_read on public.songs;
drop policy if exists staff_write on public.songs;
create policy public_read on public.songs for select to anon, authenticated using (active or public.is_staff());
create policy staff_write on public.songs for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop trigger if exists audit_songs on public.songs;
create trigger audit_songs after insert or update or delete on public.songs
for each row execute function public.audit_trigger();

-- ---------- The five songs from the Youth Alpha Christmas 2026 song sheet
-- (English words of Jingle Bells and Joy to the World are public domain; Thai words can be pasted by an admin.
--  Each song also shows its part of the original song sheet.)
insert into public.songs (title, subtitle, song_key, bpm, beats, youtube, yt_start, credits, content, sheets, sort)
select * from (values
  ('ความสุขวันคริสต์มาส', 'May the Joy of Christmas Day', 'D', 105, 4, '', 0,
   'เพลงคริสต์มาสไทย · คอร์ดจากแผ่นเพลง Youth Alpha 2026', '',
   '["sheets/joy-of-christmas-day.jpg"]'::jsonb, 1),
  ('Jingle Bells', 'จิงเกิลเบลส์', 'G', 120, 4, '', 0,
   'James Lord Pierpont (1857) · public domain · เนื้อไทยและคอร์ดจากแผ่นเพลง Youth Alpha 2026',
$$# Verse 1
[G]Dashing through the snow
In a one-horse open [C]sleigh
[Am]O'er the fields we [D7]go
Laughing all the [G]way
Bells on bob-tail ring
Making spirits [C]bright
What [Am]fun it is to [D]ride and [D7]sing
A [G]sleighing song to[D7]night [G]

# Chorus
Jingle [G]bells, jingle bells
[C]Jingle all the [G]way
Oh, [C]what fun it is to [G]ride
In a [A7]one-horse open [D7]sleigh
Jingle [G]bells, jingle bells
[C]Jingle all the [G]way
Oh, [C]what fun it is to [G]ride
In a [D7]one-horse open [G]sleigh

# Verse 2
[G]A day or two ago
I thought I'd take a [C]ride
And [Am]soon Miss Fanny [D7]Bright
Was seated by my [G]side
The horse was lean and lank
Misfortune seemed his [C]lot
We [Am]got into a [D]drifted [D7]bank
And [G]there we got up[D7]sot [G]

# Chorus$$,
   '["sheets/jingle-bells.jpg"]'::jsonb, 2),
  ('ความสุขเปรมปรีดิ์มีแก่ชาวโลก', 'Joy to the World', 'C', 96, 2, 'https://www.youtube.com/watch?v=g1USSM1Kgbw', 0,
   'Words: Isaac Watts (1719) · Music: ANTIOCH, arr. Lowell Mason (1839) · public domain · เนื้อไทย: เพลงชีวิตคริสเตียน บทที่ 44 · วิดีโอ: คริสตจักรตรัง',
$$# Verse 1
[C]Joy to the world, the Lord is come
[G]Let [C]Earth re[F]ceive [G]her [C]King
[C]Let every heart prepare Him room
And Heaven and nature sing
And [G]Heaven and nature sing
And [C]Heaven, and [F]Heaven, and [C]na[G]ture [C]sing

# Verse 2
[C]Joy to the Earth, the Savior reigns
[G]Let [C]all their [F]songs [G]em[C]ploy
[C]While fields and floods, rocks, hills and plains
Repeat the sounding joy
Re[G]peat the sounding joy
Re[C]peat, re[F]peat, the [C]sound[G]ing [C]joy$$,
   '["sheets/joy-to-the-world.jpg"]'::jsonb, 3),
  ('คริสต์มาสเป็นเวลา', 'Christmas Is a Time to Love', 'C', 96, 4, 'https://www.youtube.com/watch?v=8LbzDUxtsYA', 0,
   'Original: "Christmas Is a Time to Love" — Debby Kerner Rettino · ฉบับภาษาไทย · วิดีโอ: แพรว คณิตกุล · คอร์ดจากแผ่นเพลง Youth Alpha 2026',
$$# Intro
C Am/F G C$$,
   '["sheets/christmas-is-a-time.jpg"]'::jsonb, 4),
  ('เปี่ยมรัก', '', 'Em', 76, 4, 'https://www.youtube.com/watch?v=h9jua5pIU00', 0,
   'Liberty Worship · วิดีโอ: BFC Choir · คอร์ดจากแผ่นเพลง Youth Alpha 2026', '',
   '["sheets/piam-rak.jpg"]'::jsonb, 5)
) as v(title, subtitle, song_key, bpm, beats, youtube, yt_start, credits, content, sheets, sort)
where not exists (select 1 from public.songs);
