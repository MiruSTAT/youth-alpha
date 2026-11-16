# Youth Alpha 🎄: full handoff for the next AI

This file lets another AI (or developer) understand, rebuild, run and change the **Youth Alpha** app without the old chat. **Start with section 0**; the other sections are reference, read only the ones a task needs.

## 0. Quick start (read this first — usually the only part you need to read in full)

**Now:** live app **v32** (2026-11-17). Roadmap step 2 is done (admins per program + permissions, merged admin panel, who is online — section 5e).
**Next:** roadmap **step 3: Kids mode / Normal mode + real PC layout** (section 14, "Roadmap v31+"). Give the owner a short summary first and wait for "go". Sub-steps of an approved step need no extra "go": just report when finished.
**Still open:** a real sign-in with an admin account made by "Create an admin account" was not tried yet (the owner will make the first one); the unused branch `wip-v32` on GitHub can be deleted.

**How to read this file cheaply:** read section 0 only. For anything else, list the headings (`grep -n "^## \|^### " HANDOFF.md`) and read only the range you need. Never read the whole file "just in case".

**Owner's rules (short; full list in section 2):** calm simple UI, big Thai text, no pop-ups for kids · named warning before every delete · feedback and the admin log can never be deleted · never delete existing data · kids see only nickname, avatar, points · everything an admin can do, the super admin can do too · never type copyrighted lyrics or the owner's passwords · the owner's email never goes in the repo (it is public) · ask before big changes.

**Where things are:** repo `MiruSTAT/youth-alpha` (branch `main`, GitHub Pages) · live https://mirustat.github.io/youth-alpha/ · Supabase project `zzjoxshqatkzqsnjvlwn` · owner's Desktop folder `C:\Users\USER\Desktop\Youth Alpha\`.

**Code map (find code with grep, do not read big ranges):**
- `js/app.js` (~2200 lines): kid pages, admin pages, router. `grep -n "^async function \|^function \|^const PAGES" js/app.js` lists every page; admin pages are `p<Name>` and are listed in `PAGES` with the permission they need.
- `js/superadmin.js`: super admin pages (admins, programs, look, online, AI) · `js/data.js`: every database call (Supabase + a preview copy with the same names) · `js/i18n.js`: all text, Thai + English (new text goes in an `Object.assign(DICT.th/en, …)` block at the end) · `js/version.js`: VERSION + change log · `css/style.css` · `supabase/0NN_*.sql`: database changes, newest = `021_admin_access.sql`.

**Tools (use them, do not rebuild them):**

| Job | How |
|---|---|
| Raise the version everywhere | `tools/bump.sh 33`, then add the change log entry at the top of `UPDATES` in `js/version.js` (Thai + English; fill the previous version's `commit`) |
| Preview copy + tests | `tools/preview.sh t_v32_admins t_v31_members` (serves http://localhost:8766/; prints only failures and "no errors"). Run it with `run_in_background` and wait: the two tests take about 4 minutes |
| Live SQL | built-in browser on `https://supabase.com/dashboard/project/zzjoxshqatkzqsnjvlwn/sql/new`, paste `tools/sql.js` once, then `await QF('<commit>', 'supabase/022_x.sql', 'tests/sql_022_test.sql')` for the rolled-back test and `await QF('<commit>', 'supabase/022_x.sql')` for real. Push the files to a branch first; never paste big files into a message or a browser call |
| Desktop copy | after pushing: `device_request_folder_access(["~/Desktop"])`, then in `device_bash`: `bash -c "$(curl -fsSL https://raw.githubusercontent.com/MiruSTAT/youth-alpha/main/tools/desktop-copy.sh)"` |
| Check the live site | built-in browser on the live site: `fetch('/youth-alpha/js/version.js', {cache: 'no-store'})` shows the new VERSION after about 1–2 minutes |

**Release checklist (every published change; details in AGENTS.md and section 10):** 1 `tools/bump.sh` + change log · 2 HANDOFF.md: section 0 "Now/Next/Still open", every section you touched, one history line in 13, roadmap in 14 · 3 database change = new SQL file, rolled-back test first, then real · 4 `tools/preview.sh <tests>` (add or extend a `tests/t_vNN_*.py`), look at 1–2 screenshots · 5 commit (author `MiruSTAT <MiruSTAT@users.noreply.github.com>`) and push `main` · 6 check live · 7 Desktop copy · 8 tell the owner in a few plain sentences.

**Working efficiently (the owner asked for this):** follow "Efficiency rules" in AGENTS.md. One roadmap step per chat; after a step is released, update section 0 and give the owner a short prompt for the next chat.

**Sections of the full reference:** 1 what the app is · 2 owner's rules · 3 where everything lives · 4 tech stack, files, routes, phone storage · 5 database (5a programs, 5c look, 5d member login, 5e admins & permissions, 5b super admin, running SQL from the browser) · 6 kid side · 7 admin side · 8 songs · 9 logs · 10 release steps (10b Desktop folder) · 11 tests · 12 gotchas · 13 history · 14 roadmap and open items.

---

## 1. What the app is

- **Youth Alpha** is a free web app for a church Christmas programme in Thailand for kids aged about **9–17**.
- During the programme the kids learn about God plus piano, singing, English and Thai reading, and they prepare for a Christmas performance.
- The app tracks **attendance** and **points**. It shows a **leaderboard**, a **prize shop** (prizes are bought with points in real life; the app only shows prices) and a **songs tab** with lyrics, chords, video and a metronome. It also collects kids' **feedback**.
- **Kids** use the app without logging in: they open the link and tap their name. **Adults** (an admin plus editors) log in to manage everything.
- There are fewer than about 30 kids and 1–3 adult editors. The app is phone-first, with a Thai/English switch and Thai as the default language.
- It costs nothing to run. The website is on **GitHub Pages** and the database and logins are on the **Supabase free tier**.
- **Live site:** https://mirustat.github.io/youth-alpha/
- **Feedback QR link:** `https://mirustat.github.io/youth-alpha/#/feedback`

## 2. The owner's rules (must keep)

These are decisions the owner made. Keep them unless the owner says otherwise.

1. **UI must be simple and calm.** Use big, readable Thai text and few colours (navy, white, gold for points, red for actions). Don't clutter it with lots of boxes or colours.
2. **No pop-up notifications for kids.** For example, new points count up quietly on the kid's card instead of showing a message.
3. **Every admin delete needs a clear, named warning first.** The warning names the exact thing, for example "Delete Nong May?". Use `confirmBox(t('delWarn', name))`.
4. **Feedback can never be deleted, not even by admins.** This is enforced in the database (`009_feedback_no_delete.sql`). Don't add a delete button.
5. **The admin log (`audit_log`) is permanent.** It can't be edited, deleted or truncated (database triggers block this).
   - Only the owner can ask for a wipe. It was done once, on 2026-11-16, by briefly disabling the truncate trigger in the SQL editor and enabling it again straight away. Never do this unless the owner explicitly asks.
6. **Kids' activity log** can only be cleared by an admin who has just re-entered their password (checked on the server, within 2 minutes), and the clearing itself is written to the admin log.
7. **Money and schedule features were removed on purpose.** Don't bring them back. The old `money` and `schedule` tables still exist in the database but are unused.
8. **Bonus points can't be negative** (database rule).
9. **Kids see only nickname, avatar and points.** Never show the group or any personal info publicly.
10. **Ask before big changes.** The owner likes to hear the plan and approve it for anything large. For small clear asks, just do them.
11. **Lyrics copyright:** the AI did **not** type out copyrighted Thai lyrics for the owner. Instead it built tools so admins paste or scan the church's own sheet themselves:
    - "Paste whole sheet"
    - paste with chords kept in place
    - read a sheet picture with OCR

    English words of Jingle Bells and Joy to the World are public domain and are included.
12. The owner wants changes **tested before publishing**, and a short plain-language summary afterwards.

## 3. Where everything lives

| Thing | Where |
|---|---|
| Repo | GitHub `MiruSTAT/youth-alpha`, branch `main`, GitHub Pages serves the repo root |
| Live site | https://mirustat.github.io/youth-alpha/ |
| Database | Supabase project ref `zzjoxshqatkzqsnjvlwn` (URL `https://zzjoxshqatkzqsnjvlwn.supabase.co`) |
| Public key | in `config.js`. It is the *publishable* key, which is safe to be public because row-level security protects the data |
| Admin login | username `admin` (the app turns a username without `@` into `<username>@youth-alpha.app`). The owner knows the password; it isn't stored here |
| SQL changes | Supabase dashboard → SQL Editor. Files are kept in `supabase/` in the repo |
| Pictures | Supabase Storage bucket `images` (public read; only staff can upload). Folders: `avatars/`, `icons/`, `sheets/` |
| Song sheet crops | `sheets/*.jpg` in the repo (the original church sheet cut per song) |

Git commits so far use author `MiruSTAT <MiruSTAT@users.noreply.github.com>`.

## 4. Tech stack and code layout

- **No build step, no framework.** It is plain HTML, CSS and ES modules served as static files.
- External scripts are loaded from CDNs only when needed:
  - `@supabase/supabase-js@2.119.0` (UMD, in `index.html`)
  - `three@0.170.0` for the 3D tree
  - Tesseract.js `5.1.1` for OCR (about 8 MB, loaded only when an admin reads a sheet)
  - SheetJS `xlsx-0.20.3` for Excel export (loaded on demand)
  - the YouTube IFrame API
  - `vendor/qrcode.js` (local copy) for QR codes
  - Google font **Noto Sans Thai**
- **Versioning:** every import and asset carries `?v=N`. **The current version is `32`.** The same number is `VERSION` in `js/version.js` and `V` in `sw.js`. Bump all of them together on every release (see section 10).
- **Service worker** (`sw.js`) makes the app work offline and open fast on weak Wi-Fi:
  - Files with `?v=` and same-origin pictures are served from the phone first (cache `ya-v<N>`, replaced on each version).
  - The page itself tries the internet first for 3.5 s, then uses the saved copy.
  - CDN libraries, Google fonts and uploaded pictures in Supabase Storage are saved the first time and kept between versions (cache `ya-keep-1`). Cross-origin files are re-fetched in CORS mode so they can be stored.
  - Supabase data calls are not cached by the service worker. Kid pages keep the last good answer in `localStorage` instead (`cached()` in `data.js`).
- **PWA:** `manifest.json` and `icon.svg` let kids "Add to Home Screen".
- **Preview mode:** if `config.js` is empty, `data.js` uses a local fake database in `localStorage` (`ya_preview_db`), with login always allowed. This is used for testing; the preview admin password in tests is `preview1`, but any password works.

### Files

| File | Lines | What it does |
|---|---|---|
| `index.html` | 54 | Shell: top bar (brand, EN/TH, 🎨 theme, 🔇 music), `#scene` canvas (3D tree), `#snow`, `<main id="view">`, bottom kid nav (🏆 ranking, 🎵 songs, 🎁 shop, ☰ menu), `#toast`, `<dialog id="dlg">`, `#kidSheet` (bottom sheet), `#tour` |
| `config.js` | 6 | `window.YA_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY }` |
| `js/app.js` | ~1700 | **Everything else**: router, all kid pages, all admin pages, song player, sync tool, export, tour, Santa, festive mode |
| `js/data.js` | ~370 | `api` object: Supabase version plus the local preview version with the same functions. Also exports `MODE`, `today()`, `bkkToday()`, `ranked()`, and the offline helper `cached(key, fn, ms)` with `net.stale` |
| `js/version.js` | ~260 | `VERSION`, `AREAS`, and `UPDATES`: update groups → versions → items `{a: area, th, en}`, newest first, with the commit id. `CHANGELOG` is the flat list. Admins see it at `#/admin/about` (grouped, collapsible) and can export it to Excel. Rules for adding entries are at the top of the file |
| `icons/` | — | PNG app icons (192, 512, maskable 512, Apple 180) made from `icon.svg` with `rsvg-convert`; listed in `manifest.json` |
| `tests/` | — | Playwright test scripts and `tests/README.md` (how to run them against a preview copy) |
| `HANDOFF.md` | — | This file. Kept in the repo, shown on the super admin page as "Details for AI" (fetched live, so it is current as soon as a release is published), and copied to the owner's Desktop folder on every release |
| `AGENTS.md`, `CLAUDE.md` | — | Rules every AI must follow when changing the app (version, detailed change log, detailed HANDOFF.md, tests, Desktop copy). `CLAUDE.md` points to `AGENTS.md` |
| `js/songtext.js` | ~140 | Moved out of app.js in v25: song text functions (`parseSong`, `renderSong`, `transposeChord`, `keyAfter`, `FLAT_KEYS`, `chordsIntoWords`, `splitSheet`, `isChordLine`, `CHORD_TOKEN`, `ytId`, …). Pure functions, no app state |
| `js/superadmin.js` | ~560 | Super admin screens, loaded with `import()` only when needed: `startFromLogin`, `superGate` (unlock / ask again), first-time `claimView`; since v32 (no separate super admin page) `superBadge(c, box)` (badge + "sign out of super admin" on the admin home), `pPrograms`, `pLook` (install switch + `drawLook` + `drawLayout`), `pAi` (handoff), `pAdmins` / `pAdminEdit` / `newAdmin` (admins & permissions), `pOnline` (who is online), and the exported `drawLogin` (member login mode card, shown on the members page). Gets app.js helpers through a context object `c` (see `saCtx()` in app.js; v32 adds `PERMS`, `dTime`, `adult`, `renderSeq()`) |
| `js/i18n.js` | 368 | `t(key, ...args)`, `getLang()`, `setLang()`, `bkkToday()`; dictionary `th` and `en` (about 330 keys each). **Every UI string goes here in both languages** |
| `js/track.js` | 34 | `track(event, detail)`: kid activity events, batched and sent every 15 s or when the app is hidden. Skipped on admin pages |
| `js/music.js` | 269 | Background music made live with Web Audio (no audio files). "Jingle Bells" (1857, public domain) with bells; in festive mode an exact SATB **Joy to the World** (from hymnary MusicXML, 92 bpm, 4 verses). `music.start/stop/toggle/setTrack('joy'/'jingle')/hold(on)/setAllowed(on)/ding()/sfx()/wantsMusic()` |
| `js/scene3d.js` | 255 | Three.js tree: drag to spin, tap for sparkles. `initScene, burst, setGlow(fraction), start, stop, refresh, celebrate, calm`. Uses pooled gifts and particle points (performance work was done) |
| `js/snow.js` | 33 | Light 2D snowfall canvas |
| `js/art.js` | 60 | Shop and avatar art. `art(val)` (emoji, uploaded picture or special SVG `chipbag`/`chips`), `pic(val)`, `isImg(val)`, `burst(el, val, n)` (flying emoji), `shrinkImage(file, max, quality)` |
| `js/metronome.js` | 86 | Sample-accurate Web Audio metronome. `metro.start(bpm, beats)/setBpm/stop`; **follow mode** `metro.follow({clock, beats:[sec…], perBar, offset, sound, onBeat})` clicks on recorded beat times of a video; `setSound`, `setOffset` |
| `js/videosync.js` | 66 | `videoClock(ytPlayer)`: smooth clock on top of YouTube's coarse time reports (polls every 30 ms, nudges 15%, jumps on seeks over 0.35 s). Also `cleanBeats(taps)` (removes double taps, fills missed taps, line-fits), `bpmOf(beats)`, `hashText(s)` (FNV-1a), `lowerBound` |
| `js/ocr.js` | 394 | `readSheet(src, {onProgress, skipTitles, key})`: reads a song-sheet picture into the `[C]lyrics` format (see 8.6) |
| `js/songs-seed.js` | 63 | The song list for preview mode only |
| `css/style.css` | 762 | All styles. Kid side uses variables `--navy --sheet --card --pt --accent`, and so on; `body.adult` switches to a light admin look. Themes are `body[data-theme="snow"|"night"|"red"|"forest"]`; the **default theme is `snow`** (white) |
| `supabase/*.sql` | — | Database setup: `schema.sql`, then `002`…`021`, all already run on the live database |
| `vendor/qrcode.js` | — | QR library |
| `sheets/*.jpg` | — | Crops of the church sheet: `joy-of-christmas-day`, `jingle-bells`, `joy-to-the-world`, `christmas-is-a-time`, `piam-rak` |

### app.js structure (top to bottom)

- **Helpers:**
  - `$`, `esc` (HTML escape; always use it for user text)
  - `AVATARS` list
  - point-category cache `pcats()`, `cName(c)`, `cOf(key)`
  - `toast(msg)`, `fail(e)`
  - `modal(title, innerHtml, {okText, extra, danger})`: returns a Promise of `FormData` (OK) or the `value` of the button pressed
  - `confirmBox(msg, okText, danger)`
  - `leaderboard(force)` (cached), `pageHead(title, backTo)`
- **Themes:** `THEMES`, `applyTheme(k)`
- **Event settings:**
  - `eventInfo(force)` reads the `event_info` view into `evCache`
  - `MUSIC_OPTS` (all music switch keys)
  - `songOpts` (per-song switches); `moApp(k)` (app-wide switch), `mo(k)` (app-wide AND per-song)
  - `applyAppOpts()`
- **Top bar:** `paintChrome()`, language, music and theme buttons; music starts on the first tap if the kid hadn't muted it
- **Kid pages:** `kidRank`, `kidDetail`, `catInfo`, `hearts`, `openBible`, `kidMenu`, `openThemes`, `feedbackForm` (+ `openFeedback`, `kidFeedbackPage`), `kidSheet(html)` (bottom-sheet helper), `kidShop`
- **Songs:**
  - text: `parseSong`, `renderSong`, transposing helpers, `chordsIntoWords`, `splitSheet`, `ytId`
  - pages: `songList` cache, `kidSongs`, `songCredits`
  - player: `kidSong(id)`, `ytFallback`, `loadYT`, `songSettings`
- **Extras:** `TOUR`, `showTour`, `maybeTour`, Santa (`santaSoon`, `santaPeek`), festive mode (`treeTapped`, `startFestive`, `endFestive`, tap sound)
- **Admin:**
  - `adultGate(page)` routes `#/admin/<page>/<id>`; `adultHome()` shows the grouped menu with red "needs attention" dots from `computeNeeds()`
  - `loginView`, `pendingView`
  - pages: `pAttendance`, `pPoints` (3-step wizard), `pHistory`, `pKids` + `kidForm`, `pAttSummary`, `pPcats` + `pcForm`, `pShop` + `itemForm`
  - songs: `pSongs`, `pasteWholeSheet`, `pSongEdit`, `songSwitches`, `syncState`, `syncCard`, `pSync`
  - `pFeedback` (+ QR), `pMusicSet`, `pSettings`, `pExport` + `buildExcel`, `describeLog`
- **Router:**
  - `render()` runs on every `hashchange`
  - the `adult` body class marks admin pages; `stopPlayer()` and `syncCleanup` run when you leave a page
  - kid pages call `ensureScene()` and `eventInfo()` first
- **Start-up:** `render()`, `maybeTour` after 1.8 s, `santaSoon(true)`, `track('open_app', theme · lang · installed/browser · screen size)`, and service worker registration

### Routes

| Hash | Page |
|---|---|
| `#/` | Kid ranking (home) |
| `#/songs`, `#/songs/<id>` | Song list, song player (redirects home if the songs tab is switched off) |
| `#/shop` | Prize shop |
| `#/menu` | Menu (feedback, Bible, song credits, language, help/tour, adult login link) |
| `#/feedback` | Feedback as its own page (what the QR code opens) |
| `#/login` | v31 member sign-in page (only when the program's login mode is not `off`; otherwise it goes home) |
| `#/admin` | Admin home or login |
| `#/admin/attendance`, `/attsum` | Attendance, attendance totals |
| `#/admin/points`, `/history` | Give points, points history (undo) |
| `#/admin/kids` | Kids list and editing |
| `#/admin/members` | v31 member accounts (**admin only**) |
| `#/admin/pcats` | Point categories |
| `#/admin/shop` | Prizes |
| `#/admin/songs`, `/song/<id or new>`, `/sync/<id>` | Song list, song editor, tap-along video sync |
| `#/admin/feedback` | Feedback list, on/off switch, QR |
| `#/admin/musicset` | Music switches (**admin only**) |
| `#/admin/settings` | Tip frequency, attendance points (**admin only**) |
| `#/admin/export` | Excel export and logs |
| `#/admin/redeem`, `/redeem/<kidId>` | Prize redemption: pick a kid, then pick a prize |
| `#/admin/notice` | Announcement line and verse of the week |
| `#/admin/weekly` | Weekly summary |
| `#/admin/about` | Version number; admins: short "What's new" (last 5 versions); super admin: grouped change log + Excel export |
| `#/admin/admins`, `/admins/<user id>` | v32 super admin only: admins & permissions list, one admin's page (programs × permissions, on/off, new password) |
| `#/admin/programs` | v32 super admin only: programs (was a section of the super admin page) |
| `#/admin/look` | v32 super admin only: install switch, this program's settings (v28) and layout (v29) |
| `#/admin/online` | v32 super admin only: who is online |
| `#/admin/ai` | v32 super admin only: details for AI (HANDOFF.md, copy as prompt / download) |
| `#/admin/super` | Old link (and where the emailed sign-in link used to land): now just opens `#/admin`. The two-step screens still show when the super admin session is not unlocked |

### localStorage keys (on each phone)

| Key | Holds |
|---|---|
| `ya_me` | The kid id chosen with "this is me" |
| `ya_seen_<kidId>` | Last total seen, for the count-up |
| `ya_music` | `on` / `off` |
| `ya_lang` | Language (inside i18n) |
| `ya_theme` | Theme |
| `ya_tour` | `{done, last, n}`: first full tour, then one tip every `tip_days` |
| `ya_song` | Player preferences: `t_<songId>` (transpose), `chords`, `fs` (text size), `lang` |
| `ya_fb_<date>` | Feedback already sent today |
| `ya_fb_seen` | Admin: newest feedback already seen |
| `ya_dev` | Random device id for analytics |
| `ya_preview_db` | Preview-mode database |
| `ya_member`, `ya_member_me` | v31: the member's sign-in token and the last `member_me` answer (per program via `pkey()`: program 1 keeps these names, others get `_p<id>`). Removed on sign-out or when the server says the sign-in is no longer good |
| `ya_c_lb`, `ya_c_pcats`, `ya_c_songs`, `ya_c_ev`, `ya_c_shop` | Last good answers for kid pages, used when offline or when the network takes over 6 s |

## 5. Database (Supabase)

To set up a new copy, run these files in the SQL editor in this order: `schema.sql`, `002`, `003` … `021`. After `017`, store the owner's email by hand (see 5b); it is not in the repo. Each one is safe to re-run.

### Tables

| Table | Columns (main) | Notes |
|---|---|---|
| `staff` | `user_id` (→ auth.users), `display_name`, `role` (`admin`/`editor`), `active` (v32) | Adult accounts. Since v32 what they may do is in `staff_programs` (section 5e); `role` is only a label now. Made / approved / switched off by the super admin only |
| `staff_programs` (v32) | `user_id`, `program_id`, `perms text[]` (subset of points, kids, songs, shop, feedback, notice, settings), `updated_at` | One row per adult per program. Empty `perms` = no access to that program (rows are never deleted). Audited |
| `admin_presence` (v32) | `user_id` (pk), `program_id`, `page`, `seen_at` | "Who is online"; written only by `admin_ping`, read only by `admin_online` |
| `kids` | `id`, `nickname` (1–30), `avatar` (emoji or image URL), `grp`, `active` | |
| `attendance` | `kid_id`, `day`, `session` (`main`), `status` (`present`/`leave`/`absent`), `updated_by` | Unique per (kid, day, session) |
| `attendance_rounds` | `day`, `session`, `finished`, `finished_by/at` | "Finished checking" marker |
| `points` | `kid_id`, `skill` (FK → `point_categories.key`), `detail`, `amount` (−1000…1000), `note`, `attendance_id` (unique), `given_by` | A check `bonus_positive` stops bonus points from being negative |
| `point_categories` | `key`, `name_th`, `name_en`, `icon`, `info` (≤500, kids see it), `details` (newline list, e.g. เปียโน/ร้องเพลง/ซ้อมดนตรี), `sort`, `active` | Defaults: music, english, thai, questions, chores, attendance, bonus |
| `shop_items` | `name`, `icon`, `price`, `active`, `sort`, `category_id` (nullable, unused now) | |
| `shop_categories`, `schedule`, `money` | — | **Unused** (features removed) |
| `settings` (single row, id=1) | `attendance_points` (default 10), `event_dow/start/end`, `fb_dow/start/end` (old), `tip_days`, `fb_open` (bool), `music` (jsonb), `announce` (≤160), `verse_text` (≤400), `verse_ref` (≤60), `install_on` (bool, default false) | `music` holds the app-wide music switches; a missing key means on. The last three are the announcement line and verse of the week |
| `redemptions` | `kid_id`, `item_id` (nullable), `item_name`, `item_icon`, `price`, `note`, `created_by`, `created_at` | A prize given to a kid. Staff only (no public access). Insert is blocked by a trigger if the price is more than the kid's points to spend. Audited |
| `feedback` | `kid_id` (nullable), `kid_name`, `mood` (0–4), `message` (1–500) | Insert is allowed only while `feedback_open()` is true; **no delete** |
| `songs` | `title`, `subtitle`, `song_key`, `bpm` (30–240), `beats` (2–12), `youtube`, `yt_start`, `credits`, `content` (≤20000), `sheets` (jsonb list of image URLs or `sheets/…jpg`), `sort`, `active`, `sync` (jsonb), `opts` (jsonb) | `sync` = `{video, beats:[sec…], offset, lines:[[sec, lineNo]…], linesHash}`. `opts` = per-song switches (same keys as the player switches, plus `sheetOnly`) |
| `audit_log` | `created_at`, `actor`, `actor_email`, `table_name`, `op`, `row_key`, `old_data`, `new_data`, `program_id` (v32; null for rows before v32 and for adult-account rows) | Permanent: triggers `audit_log_no_change` and `audit_log_no_truncate` block changes. Since v32 only the super admin can read it |
| `kid_events` | `device_id`, `kid_id`, `event` (`^[a-z_]{1,40}$`), `detail` (≤120), `path` | Anyone can insert; since v32 only the super admin can read the rows (admins get counts through `kid_week_stats`) |

### Views (public)

- **`leaderboard`:** `id`, `nickname`, `avatar`, `total`, `spent` (active kids only). `total` is the ranking score and never drops when a prize is given. Points to spend = `total − spent`.
- **`kid_skill_totals`:** `kid_id`, `skill`, `detail`, `total`.
- **`event_info`:** `event_dow`, `event_start`, `event_end`, `fb_dow`, `fb_start`, `fb_end`, `tip_days`, `fb_open`, `music`, `announce`, `verse_text`, `verse_ref`, `install_on`. Kids read the switches, the announcement, the verse and the install switch from here.

### Functions

| Function | What it does |
|---|---|
| `is_staff()`, `is_admin()` | v32: `is_staff()` = super admin, or an active adult with at least one permission somewhere; `is_admin()` = **super admin only** (everything that was "admin only" became a permission or super-only). Per-program checks are `in_program(p)` and `can(p, perm)` (section 5e) |
| `my_role()` | Returns `admin`, `editor`, `pending` or null |
| `claim_admin(name)` | Only works when there is no admin yet |
| `pending_users()`, `staff_list()` | Admin only |
| `sync_attendance_points()` (trigger) | Marking "present" gives `attendance_points` automatically, linked by `attendance_id`, so points are never given twice; changing the status removes them |
| `feedback_open()` | Returns `settings.fb_open` |
| `redeem_check()` (trigger) | Before insert on `redemptions`: raises `not enough points to spend` if the price is above `sum(points) − sum(redemptions)`; sets `created_by` |
| `save_notice(announce, verse_text, verse_ref)` | Lets any staff member (not only the admin) change the announcement and verse; the change is logged |
| `audit_trigger()` | On `kids`, `points`, `attendance`, `attendance_rounds`, `shop_items`, `point_categories`, `settings`, `staff`, `songs`, `redemptions`; it records old and new rows. A no-change update is skipped |
| `audit_log_protect()` | Raises an error on any update, delete or truncate of the log |
| `clear_kid_events()` | Admin only. The login token must be less than 120 s old (the app re-signs in with the password first). The clear is logged in `audit_log` |

### Security (row-level security)

- **Not logged in:** visitors can read the `leaderboard`, `kid_skill_totals`, `event_info`, `point_categories`, active `shop_items` and active `songs`. They can insert `feedback` while it is open, and insert `kid_events`.
- **Staff (v32):** per program and per permission, see section 5e. The old "staff can do everything" rules are gone.
- **Storage bucket `images`:** public to view; only staff can upload, update or delete. Limit is 3 MB per file; types jpeg/png/webp/gif.

### 5a. Programs (v27, `supabase/018_programs.sql`) — READ THIS BEFORE ANY DATABASE CODE

- **Table `programs`** (`id`, `slug`, `name`, `archived`, `copied_from`, `look` jsonb for v28+, `created_at`). Public can read it. Created/renamed/archived only through `program_create(name, slug, from, people, shop, songs)` and `program_update(id, name, archived)` (super admin only). Programs are never deleted; program 1 cannot be archived.
- **Every program-owned table has `program_id int not null default 1`:** kids, point_categories, shop_items, songs, feedback, kid_events, attendance, attendance_rounds, points, redemptions. Everything that existed before v27 is program 1 "Youth Alpha Christmas 2026" (slug `youth-alpha-christmas-2026`).
- **attendance / points / redemptions** get `program_id` from their kid (trigger `program_from_kid`, before insert), so client code does not set it there.
- **attendance_rounds** primary key is now `(program_id, day, session)`; the client upsert sends `program_id`.
- **settings:** one row per program, `settings.id = programs.id` (the old `id = 1` check was dropped). `event_info` has `program_id` (= settings.id); the client filters `.eq('program_id', P())`.
- **point_categories:** keys stay globally unique. `program_create` copies the source program's categories with the suffix `_p<newid>` (`attendance_p2`, `bonus_p2`, …). The base key (strip `/_p\d+$/`, `baseKey()` in app.js) keeps the special meaning: `sync_attendance_points` uses `attendance` for program 1 and `attendance_p<id>` otherwise; the check `bonus_positive` uses the base key.
- **Per program now:** `feedback_open(p)` (the feedback insert policy checks the row's program), `save_notice(…, p_program)`, `superadmin_set(key, value, p_program)`, `clear_kid_events(p_program)`.
- **Shared by all programs:** staff (admins/editors), the super admin, the audit log.
- **Links:** the plain link opens program 1 (old links and the printed QR still work); other programs open with `?p=<slug>` before the `#`: `https://mirustat.github.io/youth-alpha/?p=easter-2027#/`. `linkFor(slug)` in data.js builds it.
- **Client:** `program` / `P()` in data.js is set once at start by `loadProgram()` in app.js (reads `?p`, finds the program in the cached `programs` list, falls back to program 1 with a toast if the slug is unknown). Every Supabase query in data.js filters or inserts with `P()`. Phone storage that belongs to a program uses `pkey()` (program 1 keeps the old names: `ya_me`, `ya_fb_<date>`, `ya_fb_seen`; others get `_p<id>`); offline caches use `ya_c_<id>_<name>`. Switching program on the admin home loads the other link (full reload).
- **Backup before v27:** copies of every table as `private.bk_20261116_<table>` (made just before 018 ran). Do not drop them without the owner's OK.
- **Tested on the live database** inside a rolled-back transaction (simulated super admin): program created as id 2 with settings, `_p2` categories, kids, songs, prizes; attendance gave `attendance_p2` points in program 2 only; rounds and leaderboard stayed separate; a negative `bonus_p2` was refused; feedback refused while closed. (Sequence note: that test used program id 2, so the first real new program will be id 3.)
- **Preview mode** keeps only the program list (create/rename/archive work); its data is not split by program.

### 5c. Program settings, layout and theme packs (v28–v30, `supabase/019_program_look.sql`)

- **Where it is stored:** `programs.look` (jsonb) of each program. Written only by `program_set_look(p_id int, p_look jsonb)` (security definer, super admin only, must be a JSON object, max 20 000 characters). Every change is in `audit_log` via the `audit_programs` trigger (018). The public can read it (programs is public-read), so **never put secrets in `look`**.
- **Shape** (every key optional; missing = the normal app):
  `{ title, emoji, pack: 'christmas'|'plain' (v30 adds 'easter'), font: 'noto'|'sarabun'|'kanit'|'mitr'|'prompt', size: 0.9–1.3, off: { songs, shop, feedback, bible, music, tree, snow, santa, festive: true = switched off }, words: { th: { <i18n key>: text }, en: { … } } }`
- **Client, app.js:** the `LOOK` object (right after `loadProgram()`) lists `FONTS`, `FEATS` (switches with icons, in the order shown), `WORDS` (the i18n keys an admin may change: ranking, songs, shop, menu, songsTitle, shopTitle, shopSub, santaHo) and `PACKS` (each pack's default emoji and its own wording, e.g. plain → songsTitle "เพลงนมัสการ" / "Worship songs"). `feat(k)` = not switched off. `applyLook()` runs at the end of `loadProgram()` and again after saving: sets the i18n overrides (pack words, then the program's words on top), the brand emoji + name and `document.title`, the CSS var `--look-emoji`, loads the Google font (`<link data-font>`) and sets `--font` on `<html>`, sets `<html>` font-size to 18px × size, `body.dataset.pack`, and a class `off-<k>` on body for every switched-off part.
- **What each switch does:** songs → nav tab hidden (`body.off-songs`) and `#/songs` redirects home (same check as the music switch `songsTab`); shop → tab hidden, `#/shop` redirects; feedback → menu row hidden, `#/feedback` redirects; bible → menu row hidden; music → `music.setAllowed(false)`, 🔇 button hidden; tree → `ensureScene()` is not called, `#scene` hidden, and the program emoji floats big in its place (`body.off-tree::before`); snow → `snow.stop()`; santa → `santaPeek` treats the page as busy; festive → 5 taps on the tree do nothing. Data is never touched, only hidden. The admin side is not affected.
- **i18n.js:** `setOverrides({th, en})` and `tBase(key, lang)` (the built-in text, used as placeholders). `t()` checks the override first, only for plain-string keys (function keys cannot be overridden).
- **Super admin page:** card "🎨 This program's settings" (`drawLook(c)` in superadmin.js) edits the program of the link that is open. Choosing a non-Christmas pack unticks tree, snow, Santa and special mode (they can be ticked again). Save → `api.programSetLook` → `c.program.look` updated, `ya_c_*programs*` cache cleared, `c.applyLook()`. The context `saCtx()` now also passes `tBase`, `applyLook`, `LOOK`.
- **v29 layout (`look.layout`):** `{ tabs: [order], home: [order], menu: [order], hide: { tabs: [], home: [], menu: [] } }`. Lists and defaults in `LOOK.LAYOUT` (tabs rank/songs/shop/menu; home parts notice/me/rank/verse; menu rows fb/bible/credits/lang/install/help/adult), items that can never be hidden in `LOOK.LOCKED` (tabs rank + menu, home rank, menu adult). `layKeys(kind, withHidden)` in app.js returns the order (unknown/new keys appended in default order, so adding a new part later is safe). Applied in `applyLook()` (re-appends `#kidNav` links in order, class `lay-hide`), `kidRank()` (built from a `part` map joined in order) and `kidMenu()` (rows re-appended by `data-m` / `data-k="adult"`, hidden ones removed). Layout hiding is visual only; a hidden page still opens from a direct link (use the v28 part switches to really turn a page off). Feature switches (v28) still win.
- **Layout editor:** card "🧩 Layout" (`drawLayout(c)` in superadmin.js): ⠿ handle drag with pointer events (works with fingers; `touch-action: none` on the list), ▲▼ buttons, 👁️/🙈 hide, 🔒 for locked items, mini phone preview (`#layPhone`, placed above the lists on narrow screens), Save, "Back to normal" (confirm, saves `layout: {}`). Saves with the same `program_set_look`, merging into the current `c.program.look` (the settings card also merges at submit time, so the two cards never overwrite each other).
- **v30 Easter pack (`look.pack = 'easter'`):** `LOOK.PACKS` entries now carry `emoji`, `mascot` (peeking friend: 🎅 / 🕊️ / 🐑), `gift` (what bursts when it is tapped), `things` (cutscene items) and `words` (easter: songsTitle, santaHo, joyTitle). `packInfo()` returns the current pack. `applyLook()` sets `body.dataset.pack` and calls `music.setPack(pack)`.
  - **3D (`scene3d.js`):** `initScene(el, { pack })` (app.js `ensureScene` passes `document.body.dataset.pack`; the scene is built once, so a pack change shows after the app is opened again — the super admin card says so). `buildEaster()` makes a green half-sphere hill, a wooden cross (two boxes) with a white cloth, a golden torus halo in the `star` slot (sways instead of spinning), 28 pastel eggs on the hill in the `ornaments` slot (they light up with points like the ornaments), and `makeGift()` returns `makeEgg()` (egg + band) so the two bobbing items and the special-mode burst are eggs. Pink petals instead of white 3D snow; pastel sparkles. The Christmas build was only moved into `buildTree()/buildGifts()/buildRest()`, unchanged.
  - **Music (`music.js`):** `EASTER` = "Easter Hymn" (Lyra Davidica 1708, public domain), melody copied from the English Hymnal 1906 (public domain) score, key C, 32 bars of 4 beats; `EASTER_BASS` one root per bar; `scheduleEaster(joy)`: bells at 104 bpm normally, brass + timpani at 88 bpm in the special mode. `music.setPack(p)` switches (restarts if playing). The plain pack keeps Jingle Bells but its editor unticks background music.
  - **Special mode in Easter:** same 5-taps start, cutscene title "พระเยซูทรงคืนพระชนม์! / He is risen!", then `eggHunt()` in app.js: a fixed layer `.egg-hunt` with 8 CSS-drawn striped eggs at random spots (14–76% of the screen height) and a small counter pill (no pop-ups); tap → 🐣, sparkle, ding; all found → "เจอไข่ครบแล้ว!", event `egg_hunt` (label added to `EVT_TH`), layer fades out. `endFestive()` removes the layer; hidden on adult pages.
  - **Editor:** choosing Easter ticks tree/santa/festive/music; choosing plain unticks tree/snow/santa/festive/music. Labels of the switches became pack-neutral ("3D scene", "Peeking friend (Santa / lamb)", "Snow / petals", "Special mode (egg hunt in Easter)").
  - Tested: tests/t_v30_easter.py (pack saved, petals colour, cutscene title, 8 eggs, counter, all found, layer removed, Easter songs title) + v28/v29 tests.
- **Program copies:** `program_create` (018) does not copy `look`; set it on the new program's link.
- **Tested:** preview (tests/t_v28_look.py: save title/emoji/pack/font/size/switches/words, reload, shop redirect, menu rows, worship-song title, English words, form keeps values) and regression tests/t_v27_programs.py. Live: 019 run on 2026-11-16 (function exists, security definer); live program 1 `look` is still `{}`.

### 5d. Member login (v31, `supabase/020_members.sql`) — DONE (database + app screens), every program still `off`

- **Run live on 2026-11-16** (after a rolled-back test that checked every rule; results below). After running: program 1 `login_mode = 'off'`, leaderboard still shows the kid, 9 `member*` functions exist.
- **`programs.login_mode`** text, default `'off'`, check in (`off`, `personal`, `all`). Public (programs is public-read), so the app knows the mode before anyone signs in. Set only by `program_set_login(p_id, p_mode)` (super admin only; audited by the `audit_programs` trigger).
  - `off`: exactly the old app (no sign-in; "this is me" by tapping a name, stored in localStorage `ya_me`).
  - `personal`: ranking stays public (nickname/avatar/points); a kid's point details per category (`kid_skill_totals`) are returned only to the signed-in member linked to that kid (and staff).
  - `all`: `leaderboard`, `kid_skill_totals`, `songs`, `shop_items` return **nothing** unless a member of that program is signed in (staff always see everything).
- **Tables (private schema, RLS on, no grants):** `private.members` (id uuid, program_id, username `^[a-z0-9][a-z0-9._-]{2,29}$` unique per program, display_name ≤40, pw_hash bcrypt, kid_id → kids, active, failed, locked_until, last_login, created_by, created_at) and `private.member_sessions` (token_hash = sha256 hex of the token, member_id, expires_at = 30 days, created_at). Accounts are never deleted (switch `active` off). 5 wrong passwords → locked 15 minutes.
- **How the app proves who is signed in:** `member_login` returns a random 48-hex token. The app must keep it in localStorage (per program, use `pkey('ya_member')`) and send it on **every** request as the header **`x-member-token`**. Verified on the live site that supabase-js 2.119 sends it for both `.from()` and `.rpc()` after `sb.rest.headers.set('x-member-token', tok)` (and stops after `sb.rest.headers.delete(...)`). The client is created in `js/data.js` line ~19 (`window.supabase.createClient(...)`).
- **Functions** (all security definer):
  - `member_current(p)` → (member_id, kid_id) from the header; `login_mode(p)`; `member_ok(p)` (may see kid pages); `member_sees_kid(p, kid)` (may see that kid's details). Used inside the views/policies.
  - Views changed (same columns as before, only a WHERE added): `leaderboard … where k.active and member_ok(k.program_id)`; `kid_skill_totals … where member_sees_kid(k.program_id, k.id)`. Policies replaced: `songs.public_read` and `shop_items.public_read` = `(active and member_ok(program_id)) or is_staff()`.
  - Members (anon may call): `member_login(p_program, p_username, p_password)` → `{ok, token, username, display_name, kid_id}` or `{ok:false, reason:'wrong'|'locked', minutes}` (username is trimmed + lower-cased); `member_me(p_program)` → json or null; `member_logout(p_program)` (expires the session, row kept); `member_password(p_program, p_old, p_new)` → `{ok}` or reason `signin|wrong|short` (min 4).
  - Admins only (`is_admin()`): `member_list(p_program)` → id, username, display_name, kid_id, kid_name, active, last_login, locked, created_at; `member_save(p_program, p_id null=new, p_username, p_display, p_kid, p_active, p_password null=keep)` → id. Writes an `audit_log` row (table_name `members`, password hash never logged, `password_changed` flag). Switching an account off ends its sessions.
- **Rolled-back live test result (2026-11-16):** `OFF lb=1 skills=2 songs=5 shop=1 | ALL nobody lb=0 songs=0 shop=0 | wrong password refused, login ok token 48 | ALL signed lb=1 songs=5 skills=2 me={testkid…} | PERSONAL signed own=2 others=0, nobody skills=0 lb=1 | after logout me=null | anon member_list refused`. The test script is the `do $t$ … raise exception 'TEST RESULT: %'` pattern (see "Running SQL from the browser").
- **App screens (v31, built and tested on 2026-11-17):**
  - **`js/data.js`:** `member = { token, me }` (exported) and `program.login`. Supabase API: `memberUse(tok)` sets/deletes the header `x-member-token` on `sb.rest.headers` (works whether `headers` is a `Headers` object or a plain object), `memberLogin(u, pw)`, `memberMe()`, `memberLogout()`, `memberPassword(old, new)`, `memberList()`, `memberSave({id?, username, display_name, kid_id, active, password?})` (password `null` = keep), `programSetLogin(id, mode)`. All pass `P()` as `p_program`. The **preview** copy has the same functions and the same rules (5 wrong = 15 min lock, `personal` hides other kids' `skills`/`details`, `all` empties leaderboard/songs/shop unless a member or an adult is signed in; `db.members`, `db.msess`; preview data is not split by program, the mode is read from `db.programs`).
  - **`js/app.js` start-up:** `loadProgram()` ends with `await memberStart()`: `program.login` = the program row's `login_mode` (`off` if missing). If not `off`, it loads the token from `localStorage[MTOK()]` (`MTOK() = pkey('ya_member')`), calls `api.memberUse(tok)` and `api.memberMe()`; `null` → `dropMember()`; a network error keeps the last answer saved in `ya_member_me` (offline use). `syncMe()` writes the member's `kid_id` into the old "this is me" key `ME()` (or removes it), so `kidRank`, the shop balance, the feedback "send with my name" and `track.js` keep working unchanged.
  - **Router (`render`):** on kid pages, when login is on, `staffHere` = an adult session exists on this phone (adults see everything). Every 60 s at most (and only online) the saved sign-in is re-checked with `memberMe()`, so an account switched off by an admin is noticed on an open phone. `#/login` → `kidLogin()`. In `all` mode, any other kid route without a member (and without an adult session) goes to `#/login`; the body class `login-page` hides the bottom tabs there (the page has its own "For adults" link). Admin routes are not affected.
  - **Kid side:** `kidLogin()` page (big inputs `.k-input`, messages written in `#mlMsg` on the page, no toasts/pop-ups: empty fields / wrong / "try again in N min" / no internet; "forgot your password? ask an adult"). On success: token + `me` saved, `clearKidCache()` (removes this program's `ya_c_<id>_*` saved answers and resets the in-memory caches, because they may hold a member's details), `syncMe()`, event `member_login`, go home. `kidRank`: with login on, "tap your name" becomes a "🔑 sign in to see your points" link when nobody is signed in. `kidDetail`: no "this is me / not me" buttons when login is on (a sign-in button instead when not signed in); in `personal` mode another kid's sheet shows `mOnlyOwn` instead of the category list (`closed` flag; adults on the phone still see it). `kidMenu`: first row `data-m="account"`: "🔑 Sign in" or "👤 Signed in as <display name>" → `accountSheet()` (username, a folded "change password" form with old/new/new again, messages in `#mpMsg`, and "Sign out", which calls `member_logout`, `dropMember()`, and goes to `#/login` in `all` mode or home otherwise). The menu key `account` is in `LOOK.LAYOUT.menu` (first) and `LOOK.LOCKED.menu` (cannot be hidden in the layout editor; label `lay_account`).
  - **Admin side:** `pMembers()` at `#/admin/members` (admin menu → Kids group, row "🔑 Member accounts", **admins only**, like the database rule `is_admin()`). Shows the program's mode with its explanation (and a hint that accounts can be made before the mode is on), "➕ Add account", and a list (display name, @username, linked kid, switched off / locked, last sign-in). `memberForm()` modal: username (checked `^[a-z0-9][a-z0-9._-]{2,29}$` after lower-casing), display name, linked kid (active kids), password (required for new, ≥4; for an existing account "set a new password", empty = keep; a new password also unlocks). The extra button "⛔ Switch off" shows a **named warning** (`memOffWarn`) first; "✅ Switch on" needs none. **No delete button** (accounts are never deleted). A duplicate username shows `memDup`. Changes are logged by the database (`audit_log` table_name `members`, no password hash); `describeLog` shows `@username · kid · 🔑` and the area "Member accounts".
  - **Super admin page:** new section "🔑 Member login" (`drawLogin(c)` in `js/superadmin.js`, card `#loginCard`) for the program of the open link: three radio options (off / own details only / sign in to see anything), each with a one-line explanation, the number of accounts with a link to the accounts page, and Save (enabled only after a change; choosing "all" asks first). Saves with `programSetLogin`, updates `c.program.login` and the program list, and clears the saved `programs` answer. Phones pick up a new mode the next time the app is opened. "Coming next" no longer lists member login.
  - **Events:** `member_login`, `member_logout`, `member_pw` (labels `ev_*`, in `EVT_TH`).
  - **Tested:** `tests/t_v31_members.py` (42 checks, preview copy): mode off = old app, admin adds accounts (lower-cased usernames, duplicate refused), named switch-off warning, super admin mode card, personal mode (hint, other kid's note, lock after 5 wrong, sign in, own details, change password, sign out removes token and "me", old password refused, events logged), all mode (every kid route → sign-in, no tabs, sign in → ranking/shop, sign-in kept after reload, switched-off account signed out). Plus a smoke run of every kid and admin page with mode off (no errors). **Not yet tried with a real account on the live database** (that needs the owner to switch a program on); the live database part was tested in 2026-11-16's rolled-back test, and the header path was verified then.
  - **Not done on purpose:** kids cannot make their own accounts or reset a forgotten password (an adult sets a new one); no delete of accounts; feedback by QR also needs sign-in in `all` mode (the owner said every kid route).

### 5e. Admins per program and permissions (v32, `supabase/021_admin_access.sql`) — run live on 2026-11-17

- **Model:** `staff` = adult accounts (+ `active`). `staff_programs (user_id, program_id, perms text[])` = what each adult may do in each program. Permission keys and what they cover (the same list is `PERMS` in app.js and in the SQL check):
  - `points` → attendance, attendance totals, give points, points history (tables attendance, attendance_rounds, points)
  - `kids` → kids list (table kids) **and member accounts** (`member_list`, `member_save`)
  - `songs` → songs, song editor, tap-along sync (table songs)
  - `shop` → prizes (shop_items) and giving prizes (redemptions)
  - `feedback` → read feedback, the feedback on/off switch (`settings.fb_open`), QR
  - `notice` → announcement + verse (`save_notice`, settings columns announce/verse_text/verse_ref)
  - `settings` → point categories, music switches, general settings (every other settings column); also allows feedback switch and notice
- **Checks (security definer, used by every rule):** `in_program(p)` = super admin, or an active adult with a non-empty `perms` row for p. `can(p, perm)` = super admin, or that row contains perm. **Read** of a program's working tables = `in_program`; **write** = `can(program_id, <perm>)` (policies `staff_read`, `staff_ins`, `staff_upd`, `staff_del` on kids/attendance/attendance_rounds/points/redemptions; `staff_all` on point_categories/shop_items; `staff_write` on songs; `public_read` of songs/shop_items = kids' rule OR `in_program`). `settings`: read = `in_program(id)`, update = `in_program(id)` plus the trigger `settings_super_guard`, which checks every changed column (install_on → super admin; fb_open → feedback or settings; announce/verse → notice or settings; anything else → settings). `member_ok` / `member_sees_kid` (v31) use `in_program` instead of `is_staff`. Unused tables money/schedule/shop_categories: super admin only.
- **Rule kept: everything an admin can do, the super admin can do too** (`is_superadmin()` passes every check).
- **Existing adults:** 021 gave every existing `staff` row program 1 with all 7 permissions (role admin) or all but settings (role editor) — exactly what they had. Live there was one adult, `admin` (all 7 on program 1). **Program 3 "Testing new program"** (a test made by the super admin) has no admins; the super admin can add them.
- **my_role()** now returns `pending` (no staff row), `noaccess` (switched off or no permissions anywhere), or the role. **my_access()** → `{all: true}` (super admin) or `{all: false, programs: {"1": [...]}}`.
- **Super admin functions:** `admin_list()` (every auth user except the super admin: username = part before `@youth-alpha.app`, name, pending, active, `app_login`, created/last sign-in, `access`), `admin_save(user, name, active, access jsonb)` (creates the staff row when approving; programs left out get empty perms, nothing deleted), `admin_create(username, password ≥6, name)` (inserts into `auth.users` + `auth.identities` like the existing `admin` login: email `<u>@youth-alpha.app`, bcrypt password, confirmed; plus a staff row with no programs), `admin_password(user, password ≥6)` (app logins only; logged as `staff`/`PASSWORD` without the password). `pending_users()`, `staff_list()`, `clear_kid_events()` became super admin only.
- **Logs:** `audit_log.program_id` is filled by `audit_trigger` from the row's `program_id` (or the id for settings/programs); `member_save` and `clear_kid_events` write it too. Read: super admin only. `kid_events` read: super admin only; `kid_week_stats(p, since)` gives admins `{phones, songs:[{title, n, devices}]}` for the weekly summary. In the app the super admin's admin-log export shows the open program's rows (program 1 also shows rows with no program: everything before v32 and adult-account changes).
- **Who is online:** `admin_ping(p, page)` (any staff; upsert into `admin_presence`), `admin_online()` (super admin; last 10 minutes, with name / is_super). The app pings when an admin page opens (at most every 8 s) and every 45 s while an admin page is open and visible (`adminPing` in app.js).
- **Live test (rolled back, 2026-11-17, before running it):** `super role=superadmin list=2 … saveSuper=refused | tester (points on program 1 only): kids1=1 kids3=0 givePts=ok kidUpd=0 shopIns=refused audit=0 kev=0 fb=0 setUpd=refused wk1=ok wk3=refused notice=refused members=refused adminList=refused | admin: access=all 7 on program 1, setUpd=ok install=refused kids3=0 audit=0 members=ok notice=ok online=refused | super: online=1, audit rows staff_programs/points carry program 1 | switched off → role=noaccess kids=0 | anon lb=1 songs=5 shop=1`. The script is `tests/sql_021_rollback_test.sql` (run after 021 in one query; it ends with `raise exception 'TEST RESULT: …'` so everything rolls back).
- **App side (v32):** `adult = {role, myId, access}`; `isSuper()`, `myPerms(pid)`, `can(perm)`; `PAGES` (in app.js) maps every admin page to the permission it needs (`null` = anyone in the program, `'super'` = super admin) and `pageOk(k)`; `adultGate` loads `my_access`, shows `pendingView` / `noAccessView` / `otherProgramView` (this link's program is not theirs: links to their programs), then the page or the home. Hiding in the app is only for comfort; the database is what enforces.
- **Not done on purpose / still open:** the app cannot delete admin accounts (switch off instead); there is no self sign-up button (Supabase "allow new users to sign up" is off) — the super admin creates accounts in the app; "waiting for approval" still works for any account made another way (e.g. Supabase "Invite user"). **Still untested on the live site:** a real sign-in with an account made by `admin_create` (the auth rows copy the fields of the working `admin` login, and the function itself ran in the rolled-back test, but GoTrue sign-in can only be tried with a committed account). The owner will make the first real admin account; if that sign-in fails, compare its `auth.users` / `auth.identities` rows with the `admin` login's. An AI may not create a test account by impersonating the super admin's session (that was refused on 2026-11-17).

### 5b. Super admin (v25, `supabase/017_superadmin.sql`)

- **Who:** one super admin, username **Miruku** (the owner). Its Supabase login is the owner's own Gmail and has **no Supabase password**; the only way into that login is a sign-in link emailed by Supabase.
- **Private schema `private`** (no access for `anon`/`authenticated`; only security-definer functions read it):
  - `private.owner(id=1, email)`: the owner's email, inserted by hand in the SQL editor, never in the repo.
  - `private.super_admins(user_id, username, pw_hash, failed, locked_until, pw_ok_at)`: the super admin's own password, bcrypt (`extensions.crypt`, `gen_salt('bf', 10)`). Kept here, not in Supabase Auth, so the owner could choose a short password (they asked for a 4-digit one; Supabase needs 6+).
  - `private.super_sessions(session_id, user_id, until)`: Supabase sign-in sessions (JWT claim `session_id`) that passed both steps; valid 12 hours.
- **Functions:**
  - `superadmin_start(username, password)` (anon allowed): 0.4 s delay; 5 wrong tries = 15 minute lock; on success sets `pw_ok_at = now()` and returns `{ok, email}`. Returns `{ok:false, reason:'wrong'|'locked', minutes}` instead of raising (raising would undo the failed-try counter).
  - `superadmin_unlock()`: needs `pw_ok_at` within 20 minutes and the session's sign-in time (latest `amr[].timestamp` in the JWT) after `pw_ok_at`; then stores the session in `super_sessions` and clears `pw_ok_at`.
  - `superadmin_claim(username, password)`: first time only, while `super_admins` is empty and only if the caller's email equals `private.owner.email`; creates the row and unlocks the current session.
  - `superadmin_lock()`, `superadmin_info()` (username, until), `superadmin_set(key, value)` (whitelist: `install_on`).
  - `is_superadmin()`; `is_staff()` and `is_admin()` now also return true for an unlocked super admin; `my_role()` returns `superadmin` | `superlocked` | `superclaim` | `admin` | `editor` | `pending` | null.
  - Trigger `settings_super_guard`: only the super admin can change `settings.install_on`.
  - `clear_kid_events()` now also accepts a super admin who re-entered their password in the last 2 minutes (via `superadmin_start`).
- **App flow:** login form → normal sign-in fails → `startFromLogin` → `superadmin_start` → `signInWithOtp(email, shouldCreateUser:false, emailRedirectTo: site URL)` → "check your email" screen. The email (default Supabase template "Your sign-in link"; templates can't be edited without custom SMTP) opens the site with `#access_token=…` (implicit flow). An inline script in `index.html` saves that as `window.YA_LINK` before supabase-js clears it; app.js then waits for the session and opens `#/admin/super`, where `superGate` calls `superadmin_unlock()`.
- **Limits:** the built-in mailer sends at most 2 emails an hour and only to Supabase team members (the owner's Gmail is one). Site URL is `https://mirustat.github.io/youth-alpha/`; no extra redirect URLs are set. "Allow new users to sign up" is off, so the owner's login was created with Supabase's "Invite user".
- **Since v32 there is no separate super admin page.** The admin home shows a gold "👑 Super admin · <username>" badge (`superBadge`: signed-in-until time, "sign out of super admin") and a "Super admin" group (Admins & permissions, Programs, This program's look, Who is online, Details for AI). The member login mode card is on the Member accounts page. What follows describes the old page's parts, which now live on those pages.
- **Old super admin page (`#/admin/super`, until v31):** a one-line explanation of the page; the **Programs** section (v27: each program with its link, copy link, open its admin, edit name / archive, and "New program" with name, link name filled from the name, start-from program, and copy kids / prizes / songs); username and "signed in until" time; a **"Sign out of super admin"** button (v26; was "Lock", which confused the owner) that asks first, then calls `superadmin_lock()` and signs out, so next time needs password + email link again; the kids' "Install as an app" switch; **"🔑 Member login"** mode chooser (v31, see 5d); "Details for AI": fetches `HANDOFF.md`, checks its "current version" line against `VERSION`, shows it folded inside ONE card ("Read the handoff (N sections)", each section folded with its line count; v26), and has "Copy as an AI prompt" (a short instruction header + the whole file) and "Download .md"; and a "Coming next" list.

### Running SQL from the browser (how it was done)

**v32 (easier, used for 021):** in the built-in browser tab on `https://supabase.com/dashboard/project/zzjoxshqatkzqsnjvlwn/sql/new` (the owner is signed in there), call the same API the SQL editor uses:
```js
window.Q = async (sql) => { const tok = JSON.parse(localStorage['supabase.dashboard.auth.token']).access_token;
  const r = await fetch('https://api.supabase.com/v1/projects/zzjoxshqatkzqsnjvlwn/database/query', { method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ query: sql }) });
  return r.status + ' ' + (await r.text()); };
```
One call = one transaction (checked: a failing last statement rolled back an earlier `create table`). To get a long file into the page without retyping it, push it to a work branch and `fetch('https://raw.githubusercontent.com/MiruSTAT/youth-alpha/<commit>/supabase/<file>')` (raw GitHub allows that from the page). Rolled-back test = `Q(fileText + testBlockEndingInRaiseException)`.

The older way (Monaco):

The SQL editor (Monaco) was used in the built-in browser tab:

1. Set the query with `monaco.editor.getEditors()[0].getModel().setValue(sql)`. Note `getModels()[0]` may point to a different, older tab's model, so use the editor's own model.
2. Click **Run**, then confirm **"Run query"** if a warning appears.
3. Read the result by returning `json_build_object(...)::text` and finding text that starts with `{"`.

## 6. Kid side

- **Ranking (home):**
  - All active kids, sorted by points. The top 3 get 🥇🥈🥉.
  - Tapping a name opens their detail: points per category, with the details split out (e.g. Music → piano/singing). Categories that have `info` show ⓘ, and tapping it shows the info.
  - "This is me" saves `ya_me`. Then a "my card" sits on top with rank and total, and the total **counts up** from what the phone saw last time (no pop-up).
  - The tree glows more as the kid's points rise (`setGlow`).
  - **Announcement line:** if an admin typed one, it shows in a quiet card at the top (no pop-up).
  - **Verse of the week:** if set, it shows in a card under the ranking list, and at the top of the Bible sheet.
  - **Points to spend:** once a kid has been given a prize, their card and detail sheet show "🎁 points to spend" (`total − spent`).
- **Songs tab:** see section 8. It can be switched off by an admin (the `songsTab` switch).
- **Shop:**
  - A market-stand look with shelves, two prizes per row, sorted by price.
  - Tapping a prize makes it pop out with a sparkle (chip bags spill chips) and a ding. Kids can't buy in the app; an adult gives the prize (section 7).
  - If the kid chose "this is me", their points to spend show above the stand.
  - Tapping a prize pops it, then (after 0.38 s) opens a big white card (`zoomPrize`): the picture large (uploaded pictures up to 300 px), name, price, and "<kid> has enough points" or "collect N more". Tap anywhere to close.
- **Menu:**
  - 💬 Feedback (open or closed status)
  - 📖 Bible (YouVersion links: web, Android, iOS)
  - 🎵 Song credits
  - 🌐 Language
  - ❓ Help (replays the tour)
  - 🔒 For adults
- **Feedback:**
  - Mood (😄🙂😐😢), a message, and an optional "send with my name".
  - One per phone per day.
  - Only while an admin has switched feedback on.
  - A thank-you with red hearts.
  - Also reachable as its own page (`#/feedback`) from the printed QR poster.
- **Top bar:**
  - EN/TH switch.
  - 🎨 Themes: snow (white, default), night, red, forest.
  - 🔊/🔇 background music (Jingle Bells). Music pauses while a song player is open.
- **Offline:** after one visit with internet, the app opens with no internet. Kid pages show the last saved ranking, shop and songs (lyrics, chords, sheet pictures), with a quiet line "📴 no internet — showing the last saved data". The songs list shows "✓ songs are saved on this phone" once every sheet picture is stored. Videos, feedback and all admin pages still need internet.
- **Install as an app** (menu row, shown only when `settings.install_on` is true; off by default; the switch will be on the super admin page in v25): Chrome on Android uses the browser's own install prompt (`beforeinstallprompt`); otherwise a sheet shows 3 steps for Android Chrome or iPhone Safari. Hidden when already installed. This replaced the APK idea: an APK from an unregistered developer is blocked on phones in Thailand since 30 Sep 2026 (Google developer verification).
- **Member login (v31, only when the super admin switched it on for the program; see 5d):** a sign-in page with big text (`#/login`); messages are written on the page, never as pop-ups. "Own details only" mode: everyone sees the ranking, but points by category only for yourself. "Sign in to see anything" mode: every kid page asks to sign in first, with no tabs on that page. The menu's first row is "Sign in" or "Signed in as …" (change password, sign out). There is no "this is me" button while login is on: "me" is the account's kid.
- **Tutorial:** an arrow and a bubble over a dark screen. The full tour runs on the first visit; after that, one tip every `tip_days` days (set by the admin; 0 = never).
- **Santa** peeks in from a screen edge every 1–2 minutes. Tapping him throws 🎁 and plays a ding. He doesn't appear on admin or song pages, or during the tour or sheets.
- **Special "festive" mode:**
  - Tap the 3D tree 5 times within 2.5 s.
  - Shows a golden flash, flying presents and a "Joy" title, plays **Joy to the World**, and lights up the scene.
  - In this mode every button tap makes a magic sparkle sound.
  - Tap 5 times again to turn it off.
  - Admin switches: `festive` and `festiveSfx`.

## 7. Adult / admin side

- **Login:**
  - Username plus password (a username becomes `<u>@youth-alpha.app`). There is no public sign-up button. The password box accepts 4+ characters (for the super admin; normal Supabase logins still need 6+).
  - If the normal sign-in fails and the name is the super admin's, the two-step super admin sign-in starts (section 5b).
  - v32: admin accounts are made by the super admin (Admins & permissions). An account that exists but has no staff row shows "waiting for the super admin to approve"; a switched-off account or one with no program shows "switched off / no program"; opening another program's link shows "no access" with links to their own programs. (The old "I'm the first admin" button was removed.)
- **Home** (v32 layout) has grouped menus with red indicators for things to do. Every row is shown only if the person has its permission (`PAGES`/`pageOk` in app.js):
  - Top right: **🔗 Copy user link** (the kids' link of this program, `linkFor(program.slug)`).
  - Super admin only: the gold **badge** card (`superBadge`) and the **program picker** (v27; normal admins never get it).
  - **👑 Super admin** (super admin only): Admins & permissions 👥, Programs 📁, This program's look 🎨, Who is online 🟢, Details for AI 🤖
  - **Daily:** Attendance ✅, Points ⭐, Give a prize 🎟️, Weekly summary 📊
  - **Kids:** Kids 👧, Member accounts 🔑, Announcement & verse 📣
  - **Songs:** Songs 🎵
  - **Settings:** Shop 🎁, Point categories 🏷️, Feedback 💬, Music switches 🎛️, Settings ⚙️
  - **System:** Export 📥, Version & changes ℹ️ (the row shows the version number)

  The red indicators are: no kids, empty shop, today's attendance not finished, new feedback.
- **Attendance:**
  - Pick a date. For each kid, tap Here, Leave or Absent; tapping the same one again clears it (after a named warning).
  - Counters at the top. Search when there are more than 8 kids.
  - **Multi-select** marks many kids at once.
  - "Finish round" (can be reopened).
  - "Here" automatically gives attendance points (database trigger).
  - Attendance totals page: per-kid counts against the number of rounds.
- **Points:** a 3-step wizard, one question per screen.
  1. Category (not attendance).
  2. Optional detail chip (e.g. piano), then amount: +5/10/20/50, −5/−10, or a custom number. Bonus is positive only.
  3. Tick the kids (or select all), add an optional note, then "Give".

  The history page lists the last 50 with **Undo** (named warning).
- **Kids:**
  - Add or edit nickname, avatar (emoji list or 📷 uploaded photo, shrunk to 512 px) and group.
  - Hide/show. Delete (named warning).
  - Copy the kids' link.
- **Admins & permissions (v32, super admin only, `#/admin/admins`):** "Create an admin account" (username, display name, password ≥6 typed by the super admin → then its permission page), "Waiting for approval" list, "Admins" list (name, @username, each program with n/7 permissions or "all permissions", switched off). One admin's page: display name, on/off switch (switching off asks first, naming the admin), one card per program with 7 ticks + "Tick all" (each tick has a one-line explanation), Save ("Approve and save" for a waiting account; warns when no program is ticked), and "Set new password" for app logins. Changes go to the admin log (`staff`, `staff_programs`).
- **Who is online (v32, super admin only, `#/admin/online`):** 🟢 open in the last 2 minutes / ⚪ up to 10 minutes; name (👑 for the super admin), program, page, "N s/min ago"; refreshes every 20 s.
- **Member accounts (v31; v32: needs the `kids` permission; the super admin also sees the login mode card here):** shows the program's login mode and what it means; add an account (username, display name, which kid, password ≥4); edit / set a new password (also unlocks a locked account); switch off (named warning; signs it out at once) / on. Never deleted. Accounts can be made while the mode is still off.
- **Point categories:** Thai and English name, icon (list, upload or type your own emoji), info text for kids, details list. Hide/show, delete (blocked if points use it).
- **Shop:** name, price and icon (list, upload or own emoji; special `chipbag`). Hide/show, delete.
- **Give a prize (redemption):**
  - Step 1: pick the kid (each row shows their points to spend). Step 2: pick the prize; prizes that cost too much are greyed out and say how many points are missing.
  - A confirmation names the prize, the kid, the price and what is left, and says ranking points do not change.
  - The list "prizes already given" has a **Give points back** button (named warning) that deletes the redemption.
  - The server checks the balance too (`redeem_check`).
- **Announcement & verse:** one short line (≤160 characters) for the top of the kids' home page, plus verse text and reference. Leave a field empty and save to hide it. The admin types the verse themselves.
- **Weekly summary** (last 7 days): points given, how many came to the last round, phones that opened the app, feedback count; kids who were not "present" in the last two attendance rounds (with each status); top 5 point gainers; most opened songs (from `song_open` events); prizes given.
- **Version & changes:** (v32) admins see a short "What's new" (last 5 versions, `short` text of a version if it has one, otherwise up to 4 kid/admin/songs/look/fix items, no tags, no export). The super admin sees the full page: the version in use, the change log grouped into updates (Launch, Admin tools & data safety, Songs, Prizes & offline) with a coloured area tag on every item, an Excel export button, checks the live `js/version.js` to say whether this phone has the latest one (with an "Update now" button if not), and lists every version's changes.
- **Feedback:**
  - An on/off switch; turning it off shows a warning.
  - The list with mood, name or "anonymous", and time.
  - Hearts appear when there are new ones.
  - Export to Excel.
  - **QR card:** preview, plus "download poster" (a PNG with a Thai caption and the Youth Alpha title).
- **Music switches** (admin): turn each music feature on or off for every kid (stored in `settings.music`).
  - App: `bgMusic`, `songsTab`, `festive`, `festiveSfx`.
  - Song player: `lyrics`, `video`, `metro`, `beatDots`, `scroll`, `speed`, `beatSync`, `lineSync`, `chords`, `transpose`, `textSize`, `langSwitch`, `origSheet`.
  - Since v26 the switches are in groups (`MUSIC_GROUPS` in app.js): whole app (`mg_app`) / what kids see on a song page (`mg_see`: origSheet, video, lyrics) / in-app lyrics and chords (`mg_text`) / practice buttons (`mg_tools`) / follow the video (`mg_sync`). The song-page groups fold and show "on / total". The same groups are used on each song's switch card.
  - **"All songs: video + original sheet only"** (`settings.music.simpleSongs`, v26; switched ON on the live site at the owner's request): a switch at the top of Music settings. While on, `mo(k)` returns true for song-page keys only when `k` is `video` or `origSheet`, for every song, ignoring the per-song switches (they are kept, dimmed, and apply again when it is off). Each song's switch card is folded and says the mode is on.
- **Settings** (admin): tip frequency in days, and attendance points.
- **Export:**
  - One Excel file with all sheets, or one sheet at a time.
  - Sheets: summary (now with points spent and points to spend), points, attendance, attendance totals, feedback, prizes given, shop, admin log, kid activity, kid activity summary.
  - Times are in Thai time.
  - The admin log is turned into readable text by `describeLog`.
  - v32: the admin log, kids' activity and kids' activity summary sheets (and the "all" export of them) are **super admin only**, and the feedback sheet needs the feedback permission (`xlOk` in app.js). The admin log export holds the open program's rows.
  - Also here: the **clear kids' activity log** button (v32: super admin only; warning; the super admin password is re-entered, checked by `superadmin_start`).

## 8. Songs system in detail

### 8.1 The five songs (from the church sheet "Youth Alpha Christmas 2026")

1. **ความสุขวันคริสต์มาส** (May the Joy of Christmas Day). Key D, 105 bpm. Video: BFC Choir `ximjFpXxtQk`.
2. **Jingle Bells**. Key G, 120 bpm. Video `3CWJNqyub3o`. Public-domain English words are included.
3. **ความสุขเปรมปรีดิ์มีแก่ชาวโลก** (Joy to the World). Key C, 96 bpm, 2/4. Video `g1USSM1Kgbw` (Trang church). English words are included.
4. **คริสต์มาสเป็นเวลา** (Christmas Is a Time to Love). Key C, 96 bpm. Video `8LbzDUxtsYA`.
5. **เปี่ยมรัก**. Key Em, 76 bpm. Video `U0gsICTn1-Q` (chosen by the owner).

The Thai songs start with **chord-only lines** so that key change works. Admins add the full Thai words with the tools below.

### 8.2 Lyrics text format (`songs.content`)

- `# Section name`, or `{c: name}`, starts a section.
- `[G]Jingle bells` puts a chord in brackets right before the letter it belongs over.
- A blank line separates parts.
- A line with only chord names (e.g. `C Am/F G C`) is shown as a chord-only line.
- **Chord line over a lyric line** (the old plain-text style) is also understood. Chords are mapped by column, and Thai vowel and tone marks have zero width.
- Chord pattern: `CHORD_TOKEN` (root A–G, optional #/b, quality m/maj/min/dim/aug/sus/add/M/°/ø/+, numbers, slash bass, optional brackets).
- Rules for placing chords in Thai: **never split a letter from its vowel or tone mark**, and put the chord **before a leading vowel** (เ แ โ ใ ไ).

### 8.3 Display (`parseSong` → `renderSong`)

- Each part gets a language tag (`th` if it has Thai letters, `en` if Latin, otherwise `any`). A **Thai / English / both switch** appears when a song has both languages.
- Every line gets a number `li` (used for karaoke).
- **Key change:** transposing moves both the root and the slash bass. Flat or sharp names are picked from the target key (`FLAT_KEYS`). The kid's choice is saved per song. When the key is changed, the original key is shown next to the sheet.
- Settings sheet (Aa): text size 90–200%, chords on/off, key ♭/♯ with reset.

### 8.4 Kid song player (`kidSong`)

- **Shown on the page:** header (title, subtitle), chips (key, ♩ bpm, beats/4), YouTube poster (the video loads only when tapped; uses `youtube-nocookie`; falls back to an "open on YouTube" link), language switch, lyrics, **original sheet** (`<details open>`, always shown open; tap a picture to zoom), credits.
- **Bottom dock:** beat dots (the first beat is coloured), 🥁 metronome, ⏬ auto-scroll, speed (0.5/0.75/1/1.25×, which also changes the video speed), Aa settings.
- **Auto-scroll** moves at about 8 beats per line at the current bpm × speed.
- Tapping a line moves it to the reading spot (30% from the top). The screen is kept awake while playing.
- **With recorded sync for this video:**
  - The metronome and dots follow the saved beat times (`metro.follow`); a "🔗 with video" pill shows.
  - Lines light up (karaoke) and the page follows them.
  - Line timings are used only if `linesHash` matches the current lyrics, so the timings stop being used if the words change.
- **Which features are shown:** `mo(k)` is true only when the app-wide switch (`settings.music[k]`) **and** the per-song switch (`songs.opts[k]`) are both on. If nothing in the dock is on, the dock is hidden (`no-dock`).

### 8.5 Admin song tools

- **Song list:** add a song, and **📋 Paste whole sheet**:
  - Paste the entire church sheet at once. It is split into songs by matching titles (ignoring spaces, ์ and punctuation), skipping a page header repeated on every page and the second title line.
  - Each part is converted with `chordsIntoWords`, which measures the chord line and lyric line in a proportional font (`16px Tahoma`, tab stop 36 px) so chords land over the right syllable.
  - A summary with a warning is shown before anything is replaced.
- **Song editor:**
  - Fields: title, subtitle, key (dropdown), bpm, beats, lyrics textarea (pasting multi-line text also runs `chordsIntoWords`), live 👀 preview, sheet pictures (upload, shrunk to 2000 px), YouTube link, start second, order, credits.
  - Hide/show and delete (named warning).
  - **✨ Read lyrics** on each sheet thumbnail runs OCR. **Uploading a new picture reads it automatically.** If the lyrics box isn't empty, it asks before replacing.
- **Per-song switches card** ("what kids see in this song"):
  - The same 13 player switches as the app-wide ones. A switch is greyed out if it is off app-wide.
  - **📄 "Original sheet only"** (yellow row at the top):
    - Turning it on sets every player switch off except `origSheet`, and saves `sheetOnly: true`.
    - Turning it off turns everything back on.
    - Turning any other switch on clears `sheetOnly`; turning `origSheet` off clears it too.
- **Tap-along sync (`pSync`)** has two modes over the embedded video:
  - **🥁 Beat:**
    - Tap the big button (or Space) on every beat while the video plays; it shows the live bpm.
    - Save needs at least 8 taps and cleans the beats (`cleanBeats`).
    - **✨ Auto-fill** continues at the tempo of the last 9 beats until the video ends.
    - 🎧 Test plays clicks over the video. Nudge earlier/later in 20 ms steps (saved to `offset`).
    - bpm is updated from the beats.
  - **🎤 Lines:** tap "next line" (or Space, or tap a line) when each line starts. There is undo and restart. Saving stores `lines` and `linesHash`.

### 8.6 OCR: reading a sheet picture (`js/ocr.js`)

- Runs in the browser. Tesseract (`tha+eng`) reads the **words**. **Chords are not trusted to text reading**, because it confused D/B and A/E and missed a lone C. Instead:
  1. **Prepare:** scale so text rows are about 90 px, increase contrast, sharpen.
  2. **Ink map:** split into columns (a two-column page is read one column at a time), then rows of ink per column. Thin vowel/tone-mark rows join the nearest line.
  3. **Chord rows:** rows of normal height that are mostly empty space with a few short pieces (rules on coverage, width and score). Little marks reaching up from the line below are ignored.
  4. **Tokens:** each piece is cut out (`tokens`, `tight`) and **matched by shape** (`matchChord`):
     - Candidate chords are drawn in Tahoma/Arial/sans-serif at weights 400 and 700.
     - Pieces are compared with an F1 score using 1 px dilation.
     - Chords that belong to the song's key get a small head start (`keyPrior`).
     - Two chords printed close together (like "A D") are split at the weakest column (`matchSplit`).
  5. **Rebuild:** text-reader words inside chord rows are replaced by the matched chords. Lines are sorted by block and then y. Each chord is placed as `[X]` before the syllable it sits over, building left to right with increasing positions. Title lines (`skipTitles`) and stray `|` lines are dropped.
- **Result:** on all 5 real sheets, every chord row came out correct and in order. Thai words may still lose some vowel or tone marks on small pictures, so admins should check the text.

## 9. Logs and analytics

- **Admin log:** written automatically by database triggers on every insert, update or delete of the main tables, with old and new data, the admin's email and (v32) the program. It is permanent. Only the super admin can read or export it (v32).
- **Kid activity:** `track()` events. No names are typed or stored; only the random device id, the chosen kid (if they tapped "this is me"), the event and a detail. Event names:
  - `open_app`, `view`, `tap_kid`, `tap_my_card`, `set_me`, `not_me`, `cat_info`
  - `shop_tap`, `bible_open`, `bible_link`, `theme_open`, `theme`, `lang`, `music`, `help_open`
  - `tour_next`, `tour_skip`, `tour_done`, `fb_pill`, `fb_open`, `fb_send`, `fb_qr`, `tree_tap`
  - `songs`, `song_open`, `metro`, `autoscroll`, `song_speed`, `transpose`, `yt_play`, `sheet_view`, `song_lang`
  - `credits`, `santa_tap`, `festive`, `pic_view`
  - v30–v31: `egg_hunt`, `member_login`, `member_logout`, `member_pw`

  New events need a Thai/English name `ev_<name>` in i18n and an entry in `EVT_TH`.
- **Both logs were wiped on 2026-11-16** at the owner's request. Both start from zero, and the protection triggers were checked afterwards: `audit_log_no_change` and `audit_log_no_truncate` are both enabled (`O`).

## 10. How to make a change and publish it

1. Edit the files. Add **every** new UI string to `js/i18n.js` in **both** `th` and `en`.
2. If the database changes, add a new file `supabase/015_….sql` (safe to re-run: `if not exists`, `drop … if exists`, `on conflict do nothing`) and run it in the Supabase SQL editor. If kids need a new setting, add it to the `event_info` view.
3. **Bump the version everywhere** (example: 24 → 25), and add the version at the top of the newest group in `UPDATES` in `js/version.js` (Thai and English, one item per change, with an area; see the rules at the top of that file). Fill in `commit` after committing, in the next release:
   ```bash
   sed -i 's/?v=24/?v=25/g' index.html js/*.js
   sed -i "s/const V = '24'/const V = '25'/" sw.js
   sed -i "s/VERSION = '24'/VERSION = '25'/" js/version.js
   for f in js/*.js sw.js; do node --check $f; done
   ```
   If you add a new js module, also add its name to the `FILES` list in `sw.js` so it is saved for offline use.
4. Test (section 11).
5. Commit and push:
   ```bash
   git add -A
   git -c user.name="MiruSTAT" -c user.email="MiruSTAT@users.noreply.github.com" commit -m "…"
   git push origin main
   ```
6. Wait for the GitHub Pages build (usually 1–2 minutes, sometimes up to 6; two pushes close together queue up), then check the live `index.html` contains the new `?v=`. From the shell, github.io may not be reachable; it was checked with `fetch('/youth-alpha/index.html', {cache:'no-store'})` in a browser tab on the live site.
7. Update `HANDOFF.md` (this file) in the repo, and copy the repo files plus this file to the owner's Desktop folder `Youth Alpha` (see section 10b).
8. Tell the owner in a few plain sentences. Phones may need the app closed and opened again.

## 10b. The owner's Desktop folder

The owner wants, after every change: the handoff file and the app's GitHub files in a folder on their Windows PC Desktop.
- Folder: `C:\Users\USER\Desktop\Youth Alpha\` with `HANDOFF.md` and `app\` (a copy of the repo, without the `.git` folder).
- How: the Claude desktop app must be open; ask for access to `~/Desktop` with `device_request_folder_access` (granted on 2026-11-16 for that session). In `device_bash`: `git clone` the public repo into the session home (outside `mnt/`), then copy each tracked file with `for f in $(git ls-files); do mkdir -p "$D/app/$(dirname "$f")"; cat "$f" > "$D/app/$f"; done` and `cat HANDOFF.md > "$D/HANDOFF.md"` (where `D="$HOME/mnt/Desktop/Youth Alpha"`). Overwrite with `cat >`, not `tar`/`cp`: those try to delete the old file first, and deleting is not allowed there.
- Deleting files there is off by default, so a file removed from the repo stays in the copy until the owner deletes it. Don't use git inside the Desktop folder (git needs to delete its lock files).

## 11. How to test

- Make a **preview copy**: copy the repo to a folder (e.g. `/tmp/prev`) with an **empty `config.js`**, so it uses the local fake database. Serve it with `python3 -m http.server 8766`.
- Use **Playwright** (Chromium, phone size 390×844, `is_mobile`, `has_touch`):
  - route `three.module.min.js` to a local copy
  - stub Google fonts and `i.ytimg.com`
  - for player tests, mock the YouTube API (a fake `YT.Player` with `getCurrentTime`, `getPlayerState`, and so on, written in `/tmp/ytmock.js`)
  - for OCR tests, serve Tesseract from local `node_modules`
- **Hide the tutorial in tests:** `#tour` covers the screen and blocks clicks. Use an init script that adds the CSS `#tour{display:none!important}`, or set `localStorage.ya_tour` first.
- Admin login in preview: any username and password (e.g. `admin` / `preview1`).
- **In a fresh cloud session (2026-11-17):** Playwright's own browser was not installed and could not be downloaded; `/usr/bin/google-chrome` worked with `executable_path`. three.js and supabase-js were taken from npm (`npm i three@0.170.0 @supabase/supabase-js@2.119.0` in `/tmp/npm3`). `tests/t_v31_members.py` reads `YA_VENDOR`, `YA_CHROME`, `YA_SHOTS` and seeds its own preview database (older scripts expect a `SEED` from `/tmp/t35.py`, which is not in the repo).
- `tests/t_v32_admins.py` (37 checks, seeds its own preview db with two programs, a waiting account and a points-only admin): super admin badge/group/picker, copy user link, old link redirect, create admin + permissions, approve, named switch-off warning, new password, programs/look/AI/online pages, logs only for the super admin, points-only admin sees only its pages (others open the home), export without logs/feedback, simple change log, weekly from counts, other program's link, switched-off account, wide screen. The preview copy has the same permission model in `data.js` (`db.admins`: signing in with one of those usernames acts as that admin; any other name is the default admin with every permission) but does **not** block data calls — only the live database does.
- The older tests that opened `#/admin/super` were pointed at the new pages (`t_v27` → programs, `t_v28`/`t_v29`/`t_v30` → look, `t_v25`/`t_v26` → admin home); they still need the `/tmp/t35.py` seed that is not in the repo. `t_v31_members.py` and `t_v32_admins.py` run on their own.
- Always collect `pageerror` events and check there are none. Take screenshots of changed screens and look at them.

## 12. Gotchas and lessons learned

- **Version bump:** forgetting to bump `?v=` means phones keep old files.
- **Music switches:** kid pages must load `eventInfo()` before drawing, or the switches don't apply.
- **Turning a switch on:** a switch counts as on when its key is missing. Always check `!== false`.
- **YouTube time is coarse.** Never use `getCurrentTime()` directly for beats; use `videoClock`. The beat follower stays within about 10–20 ms of the video in tests.
- **Festive mode performance:** objects are pooled and the party light is created at start, to avoid stutter (the worst stutter is about 2.5× shorter).
- **Chord placement:** building `[X]` from right to left with equal positions once reversed chord order. Build left to right with increasing positions.
- **OCR:** a missing `score` in `matchSplit` once gave a NaN mean and dropped good rows.
- **SQL:** `||` on a `"char"` column needs a `::text` cast.
- **Monaco in the Supabase editor:** setting `getModels()[0]` can edit a hidden tab, so the old query runs. Use the visible editor's model and check the screen.
- **Tour blocks clicks** in automated tests; see above.
- **Login form `minlength`** blocks form submission silently in tests (no error, no toast). It is 4 since v25.
- **Simulating the email link in tests:** `page.goto(U + '#access_token=fake')` only changes the hash on the same page; call `page.reload()` so the inline `YA_LINK` script runs.
- **Preview-mode tests:** the preview app saves its whole database on page hide (`flush` → `logEvents` → `save()`), so editing `ya_preview_db` from the test while a page is open gets overwritten. Seed test data with `context.add_init_script` instead.
- **Performance measuring:** `tests/perf_festive.py` (CPU slowed 4×). Before v24: about 15 fps normally, 7–9 fps in the special mode. The cause was ~30 pulsing glow layers in the special mode, plus a blurred top bar over the 3D canvas.
- **Service worker in tests:** block it (`service_workers='block'`) for normal tests. For offline tests allow it, set `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`, and route CDN files with `context.route` (not `page.route`) with an `access-control-allow-origin: *` header.
- **Git tags can't be pushed** from the Claude session (403); versions are tracked by `js/version.js` and the commit message instead.
- **Testing live database triggers without saving anything:** run a `do $$ … raise exception 'TEST RESULT: %', msg; end $$;` block in the SQL editor; the error message carries the result and everything rolls back.
- **Playwright `goto` to the same page with only a different `#hash` does NOT reload the page** (same-document navigation): start-up code (`loadProgram`, `memberStart`) does not run again and `pagehide` (which sends queued kid events) does not fire. Use `page.reload()` when a test needs a fresh start.
- **Member login and saved answers:** kid pages keep last answers in `ya_c_<program>_*`. They can hold a signed-in member's details, so sign-in and sign-out call `clearKidCache()`.
- **`pattern` attributes:** Chrome compiles them with the `v` flag, where `-` inside `[...]` must be escaped; an unescaped one logs a console error and the pattern is ignored. The member form checks the username in JS instead.
- **v32 permissions:** a new admin page must be added to `PAGES` in app.js with its permission, and any new table or function needs a matching `in_program` / `can` rule in SQL. RLS `WITH CHECK` on attendance/points/redemptions works with `program_id` set by the BEFORE trigger `program_from_kid` (tested live: a points-only admin could give points).
- **v32 `is_admin()` is the super admin only.** Do not use it for "an admin of this program"; use `can(p, 'settings')` or the right permission.
- **Kid privacy:** only nickname, avatar and points are public. RLS enforces this; keep new views the same.

## 13. History (commits, oldest → newest)

1. Initial commit. Youth Alpha app: kid points, attendance, leaderboard, admin.
2. Connect Supabase database.
3. Fix stretched tree on mobile; username login; remove public sign-up.
4. Fix tree stretch in the LINE in-app browser; cache-bust assets.
5. Shop, schedule, attendance totals, tutorial, snow, full song, editable point categories.
6. Ranking as home, Menu tab, themes, feedback with Sunday timer, music details, admin red indicators.
7. Snow-white default theme, Excel export, adjustable feedback window and tip frequency.
8. Remove money, schedule and activity timer; music out of menu; feedback export; light-theme contrast.
9. Grouped admin menu, per-sheet Excel export, feedback on/off switch with warning.
10. Music stays on in admin, positive-only bonus, bulk attendance, feedback hearts, Bible menu, glowing alerts.
11. Shop without categories: prizes sit directly on the stand.
12. Feedback can't be deleted; clear named warnings before every delete.
13. Permanent admin change log, kid activity log with password-protected clearing, exports; remove alert banner, rounded glow.
14. Songs tab with chords, auto-scroll, metronome and videos; picture uploads; feedback QR; Santa and 5-tap tree celebration.
15. Songs follow their video; Thai/English switch; hidden original sheet; exact Joy to the World.
16. Videos for ความสุขวันคริสต์มาส and Jingle Bells.
17. Paste the whole song sheet at once: split into songs by title, chords kept over the right words.
18. Music on/off switches for admins; read lyrics and chords from a sheet picture; beat auto-fill.
19. Sheet reading: chords matched by shape with the song's key, chord rows found on the picture, better Thai.
20. Per-song switches for what kids see (lyrics and chords, beat dots, original sheet, video, …).
21. Per-song "original sheet only" switch; original sheet always shown (v22).
22. Data operation, not a code change, 2026-11-16: admin log and kids' activity log wiped at the owner's request.
23. v23, 2026-11-16: prize redemption, announcement line, verse of the week, weekly summary, offline songs and faster loading, version page with change log. Database update `015_redeem_notice.sql`.
24. v24, 2026-11-16: special mode lag fixed (steady glow instead of 30 pulsing layers, fewer presents, 3D tree pauses when covered and lowers detail on slow phones, snow at 30 fps, no blur on the top bar, lighter harmony sounds); prize zoom in the shop; install-as-app option (off by default, `016_install_switch.sql`); app icons; detailed grouped change log with Excel export; tests and HANDOFF.md in the repo; Desktop folder on the owner's PC.
25. v25, 2026-11-16: super admin "Miruku" with two-step sign-in (own password + emailed link, `017_superadmin.sql`), super admin page (install switch, "Details for AI" from HANDOFF.md with copy/download), AGENTS.md / CLAUDE.md rules for AIs, `songtext.js` and `superadmin.js` split out of app.js, login accepts 4-character passwords.
26. v26, 2026-11-16: owner feedback on v25: super admin page explained, "Lock" became "Sign out of super admin", handoff folded into one card; music switches grouped and foldable; new "All songs: video + original sheet only" switch (`settings.music.simpleSongs`), switched on live; the song editor now loads the music switches (`eventInfo(true)`) so its card knows about that mode.
27. v27, 2026-11-16: programs (`018_programs.sql`): many programs in one database, each with its own `?p=` link and its own data; program 1 = all earlier data; super admin Programs section; admin program picker; per-program phone storage. Backup tables `private.bk_20261116_*` made first.
28. v28, 2026-11-16: program settings (`019_program_look.sql`, section 5c): name/emoji on the top bar, theme pack (Christmas / plain church), font and text size, parts on/off per program, wording overrides in Thai and English; super admin card "This program's settings".
29. v29, 2026-11-16: layout editor (section 5c): reorder and hide bottom tabs, kid home parts and menu rows per program, drag/▲▼/👁️ with a live mini preview; stored in `look.layout`, no database change.
30. v30, 2026-11-16: Easter theme pack (section 5c): cross-on-a-hill 3D scene with eggs and petals, Easter Hymn (public domain) bells / trumpets, egg-hunt special mode, lamb instead of Santa, Easter wording. No database change.
31. v31, 2026-11-17: member login screens (section 5d) on top of `020_members.sql` (run live on 2026-11-16): kid sign-in page, account sheet (change password, sign out), "own details only" and "sign in first" modes, admin "Member accounts" page (add, link to a kid, new password, switch off/on, never delete), super admin login mode chooser. No database change in this release; every program still `off`.

32. v32 (current), 2026-11-17: roadmap step 2 — admins per program with a permission checklist (`021_admin_access.sql`, run live after a rolled-back test), super admin "Admins & permissions" (create / approve / permissions / password / switch off), merged admin panel (badge + "Super admin" group; the old super admin page split into Programs, This program's look, Details for AI; login mode card on the members page), "Copy user link", regrouped menu with a Settings group, program picker for the super admin only, logs and their exports for the super admin only (admin log per program), simple change log for admins, "Who is online" (`admin_ping` / `admin_online`).

33. Docs/tools only, 2026-11-17 (no app change, still v32): HANDOFF.md section 0 "Quick start" (read first; the rest is reference), efficiency rules in AGENTS.md, `tools/` (`bump.sh`, `preview.sh`, `sql.js`, `desktop-copy.sh`) at the owner's request to use less usage per session.

## 14. Ideas and open items

### Agreed plan (owner approved on 2026-11-16; build one release at a time, summary first, wait for "go")
- **v25 (super admin): DONE**, see 5b. Live database updated (017 run, with row level security switched on for the three private tables; the owner's email stored in `private.owner`). The owner's Supabase login was created with "Invite user" on 2026-11-16; **still to do by the owner:** open that invitation email, choose the username and password on the set-up page. Until then the real two-step sign-in is untested on the live site (it was tested in the preview copy). Split of app.js started (songtext.js, superadmin.js); the rest of app.js (~1780 lines: kid pages, admin pages, song player) can be split further when touched.
- **v27 (programs): DONE**, see 5a. Original plan: each customised app is a saved "program" with its own look, settings, people, points, shop and songs, and **its own link**. One live program per link; today's data becomes program 1 "Youth Alpha Christmas 2026", untouched. Never delete existing data. A new program can copy the people list or the look from an old one. Named saved versions of a program's look as a safety net.
- **v28 (program settings): DONE**, see 5c. Easter is added as a pack in v30.
- **v29 (layout editor): DONE**, see 5c.
- **v30 (Easter pack): DONE**, see 5c.
- **v31 (member login): DONE**, see 5d (database 2026-11-16, screens 2026-11-17). All programs are still `off`; the owner decides when to switch one on.

### Roadmap v31+ (owner's requests of 2026-11-16 night; order approved by the owner; summary first and wait for "go" before each step)

Owner's answers to the open questions: **maintenance mode is per program**; the admin permission checklist below is right, **but normal admins may never see or export the admin log or the kids' activity log — only the super admin can** (normal admins may still export other things, e.g. points, kids, attendance); **visits and feedback counters are on the kids' home page, seen by everyone**; **Kids mode / Normal mode is chosen per program by the super admin, Youth Alpha stays in Kids mode**; finishing member login first was left to the AI (decided: yes, finish v31 screens first).

1. **Finish v31 member login screens** (section 5d). **DONE in v31.**
2. **DONE in v32 (section 5e).** **NEXT: step 3.** Admins and permissions + merged admin panel (owner's groups 1, 3, 4):
   - **Rule to always keep: everything an admin can do, the super admin can do too.**
   - No separate super admin page: when signed in as super admin, the normal admin panel shows a clear "Super admin" badge and extra super-only sections (merge the program panel and the super admin page into the admin panel).
   - Admin accounts per program with a permission checklist: Points & attendance, Kids list, Songs, Shop & prizes, Feedback, Announcements & verse, Settings, (Logs = super admin only). Enforced in the database (RLS / RPC checks), not only hidden in the app. Normal admins cannot see or open other programs (program switcher only for the super admin).
   - A new sign-up stays "waiting" until the super admin approves it and picks its program(s) and permissions. Existing admins keep full rights on program 1 (nobody loses access). Never delete existing data.
   - Online admin tracker (super admin only): who is online and which page they are on (heartbeat table, e.g. every 30–60 s).
   - Logs separate per program (kid_events already has program_id; audit_log needs program_id).
   - Changelog: short simple version for normal admins, the detailed grouped one (+ Excel export) for the super admin only. Remove admin/user log views and exports for normal admins.
   - "Copy user link" button at the top-right of the admin panel. Reorganise: Songs settings, Shop, Point categories, Feedback move under **Settings**; less crowded.
3. **Kids mode / Normal mode + real PC layout** (owner's note 2 and group 6): Kids mode = today's look (big, emoji, playful). Normal mode = modern, professional, few emojis (simple line icons), calm colours, for adult programs. Per program, chosen by the super admin. On PC the admin and super admin areas get a proper desktop layout (side menu, wider content, use the screen space); phones keep the current layout.
4. **Program settings polish** (group 5): program logo = an emoji **or an uploaded image with a size slider**; layout ordering by **drag only** (remove ▲▼ and similar double controls everywhere); each "part" gets its own choice instead of on/off (e.g. falling: snow / petals / off; 3D scene: tree / cross-on-hill / off; peeking friend: Santa / lamb / off; special mode: gifts / egg hunt / off; music: Jingle Bells / Easter Hymn / off).
5. **Real mobile preview** (group 6): the actual kids' app in a phone frame (e.g. an iframe of the app in a preview flag) filled with **sample test kids, points, songs and prizes that are never saved**.
6. **Visits and feedback counters on the kids' home page** (group 2), seen by everyone, each with an on/off switch for admins.
7. **Maintenance mode per program** (group 7): super admin switch. When on, kids and normal admins only see a full-screen themed scene (Christmas tree; Easter bunny looking after eggs; more themes later, chosen by the super admin), background sound, a theme (colour) switch and the text "Under maintenance". No panels at all; also block writes in the database for everyone except the super admin while it is on. The super admin keeps full access.
8. **SQL export and data science tools for the super admin** (was labelled "v32" before the numbers moved on; it will get the next free version number).

Tip from the owner: focus on one or a few tasks at a time; if a chat gets long, write the handoff and ask the owner to open a new chat.
- **Name:** stays "Youth Alpha" for now (no repo rename).
- **APK:** not built (see the install note in section 6); the owner chose the install option instead.


- The Thai words of the four Thai songs still need to be added by an admin, using Paste whole sheet or ✨ Read lyrics. Their chord-only lines are already there.
- Beat and line sync still need to be recorded per song in 🎯 Tap-along, if the owner wants karaoke on each song.
- Thai OCR sometimes drops vowel or tone marks on small or blurry pictures; a sharper photo helps.
- Unused tables (`money`, `schedule`, `shop_categories`) could be dropped later, but only if the owner agrees.
- Kid-side ideas the owner has seen but not asked for yet: prize goal with a progress bar, a "this week" ranking tab, badges, a countdown to the performance, a show mode for songs, looping one section of a video.
- Uploaded sheet pictures (Supabase Storage) are saved for offline through a CORS re-fetch. This was tested with CDN files; no song had an uploaded sheet at release time, so check it once one is uploaded.
