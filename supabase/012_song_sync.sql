-- =====================================================================
-- Youth Alpha — update 12: songs follow their video + chord text for the Thai songs. Safe to re-run.
--  * songs.sync : timings an admin records by tapping along with the video
--                 { video, beats: [seconds…], offset, lines: [[seconds, line no.]…], linesHash }
--  * chord lines (no words) for the three Thai songs, so changing key works;
--    an admin can paste the full Thai words with chords over them later.
-- =====================================================================
alter table public.songs add column if not exists sync jsonb not null default '{}'::jsonb;

update public.songs set content = $$# ท่อนแรก
D F#m
G D
Bm G A7 D
D F#m G D
Bm A D

# ท่อนรับ *
D Bm
G A D
D Bm
G A D

# ท่อน B
G A D G A D$$
where title = 'ความสุขวันคริสต์มาส' and content = '';

update public.songs set content = $$# Intro
C Am/F G C

# ท่อนรับ (x2)
C Em Am C
F G C G7

# ท่อน *
F C
Dm C
F C G
F C Dm C
F G C$$
where title = 'คริสต์มาสเป็นเวลา' and content = $$# Intro
C Am/F G C$$;

update public.songs set content = $$# ท่อน 1
Em C
D Em
C
D Em

# ท่อนรับ *
C D Bm Em
C D G B7
C D Bm Em
C D Em

# ท่อน 2
Em C
D Em
C
D Em$$
where title = 'เปี่ยมรัก' and content = '';

-- เปี่ยมรัก: the video chosen by the Youth Alpha team
update public.songs set youtube = 'https://www.youtube.com/watch?v=U0gsICTn1-Q',
  credits = 'Liberty Worship · วิดีโอ: ยิ้มนี้เพื่อเธอ · คอร์ดจากแผ่นเพลง Youth Alpha 2026'
where title = 'เปี่ยมรัก';

-- videos chosen by the Youth Alpha team
update public.songs set youtube = 'https://www.youtube.com/watch?v=ximjFpXxtQk',
  credits = 'เพลงคริสต์มาสไทย · วิดีโอ: BFC Choir · คอร์ดจากแผ่นเพลง Youth Alpha 2026'
where title = 'ความสุขวันคริสต์มาส';
update public.songs set youtube = 'https://www.youtube.com/watch?v=3CWJNqyub3o',
  credits = 'James Lord Pierpont (1857) · public domain · วิดีโอ: Christmas Songs and Carols - Love to Sing · เนื้อไทยและคอร์ดจากแผ่นเพลง Youth Alpha 2026'
where title = 'Jingle Bells';
