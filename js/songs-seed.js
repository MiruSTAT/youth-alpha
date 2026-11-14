// Starting song list for PREVIEW mode only (the live site reads the same songs from the database,
// see supabase/011_images_songs.sql). English words of Jingle Bells and Joy to the World are public domain.
export const SEED_SONGS = [
  { title: 'ความสุขวันคริสต์มาส', subtitle: 'May the Joy of Christmas Day', song_key: 'D', bpm: 105, beats: 4, youtube: '', yt_start: 0,
    credits: 'เพลงคริสต์มาสไทย · คอร์ดจากแผ่นเพลง Youth Alpha 2026',
    content: '# ท่อนแรก\nD F#m\nG D\nBm G A7 D\nD F#m G D\nBm A D\n\n# ท่อนรับ *\nD Bm\nG A D\nD Bm\nG A D\n\n# ท่อน B\nG A D G A D', sheets: ['sheets/joy-of-christmas-day.jpg'], sort: 1 },
  { title: 'Jingle Bells', subtitle: 'จิงเกิลเบลส์', song_key: 'G', bpm: 120, beats: 4, youtube: '', yt_start: 0,
    credits: 'James Lord Pierpont (1857) · public domain · เนื้อไทยและคอร์ดจากแผ่นเพลง Youth Alpha 2026',
    content: `# Verse 1
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

# Chorus`, sheets: ['sheets/jingle-bells.jpg'], sort: 2 },
  { title: 'ความสุขเปรมปรีดิ์มีแก่ชาวโลก', subtitle: 'Joy to the World', song_key: 'C', bpm: 96, beats: 2, youtube: 'https://www.youtube.com/watch?v=g1USSM1Kgbw', yt_start: 0,
    credits: 'Words: Isaac Watts (1719) · Music: ANTIOCH, arr. Lowell Mason (1839) · public domain · เนื้อไทย: เพลงชีวิตคริสเตียน บทที่ 44 · วิดีโอ: คริสตจักรตรัง',
    content: `# Verse 1
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
Re[C]peat, re[F]peat, the [C]sound[G]ing [C]joy`, sheets: ['sheets/joy-to-the-world.jpg'], sort: 3 },
  { title: 'คริสต์มาสเป็นเวลา', subtitle: 'Christmas Is a Time to Love', song_key: 'C', bpm: 96, beats: 4, youtube: 'https://www.youtube.com/watch?v=8LbzDUxtsYA', yt_start: 0,
    credits: 'Original: "Christmas Is a Time to Love" — Debby Kerner Rettino · ฉบับภาษาไทย · วิดีโอ: แพรว คณิตกุล · คอร์ดจากแผ่นเพลง Youth Alpha 2026',
    content: '# Intro\nC Am/F G C\n\n# ท่อนรับ (x2)\nC Em Am C\nF G C G7\n\n# ท่อน *\nF C\nDm C\nF C G\nF C Dm C\nF G C', sheets: ['sheets/christmas-is-a-time.jpg'], sort: 4 },
  { title: 'เปี่ยมรัก', subtitle: '', song_key: 'Em', bpm: 76, beats: 4, youtube: 'https://www.youtube.com/watch?v=U0gsICTn1-Q', yt_start: 0,
    credits: 'Liberty Worship · วิดีโอ: ยิ้มนี้เพื่อเธอ · คอร์ดจากแผ่นเพลง Youth Alpha 2026',
    content: '# ท่อน 1\nEm C\nD Em\nC\nD Em\n\n# ท่อนรับ *\nC D Bm Em\nC D G B7\nC D Bm Em\nC D Em\n\n# ท่อน 2\nEm C\nD Em\nC\nD Em', sheets: ['sheets/piam-rak.jpg'], sort: 5 },
];
