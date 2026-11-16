# Youth Alpha 🎄: full handoff for the next AI

This file is meant to let another AI (or developer) understand, rebuild, run and change the **Youth Alpha** app without needing the old chat.
Read it top to bottom once. The sections are:

1. What the app is and who it is for
2. The owner's rules (do not break these)
3. Where everything lives (links, accounts, repo)
4. Tech stack and how the code is organised
5. Database (Supabase): every table, view, function and rule
6. Kid side: every page and feature
7. Adult/admin side: every page and feature
8. Songs system in detail (lyrics format, chords, key change, video sync, karaoke, metronome, OCR)
9. Logs and analytics
10. How to make a change and publish it (step by step)
11. How to test
12. Gotchas and lessons learned
13. History of what was built (commit list)
14. Ideas and open items

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
- **Versioning:** every import and asset carries `?v=N`. **The current version is `25`.** The same number is `VERSION` in `js/version.js` and `V` in `sw.js`. Bump all of them together on every release (see section 10).
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
| `js/superadmin.js` | ~170 | Super admin screens, loaded with `import()` only when needed: `startFromLogin`, `superGate` (unlock / ask again), first-time `claimView`, and `pSuper` (the page). Gets app.js helpers through a context object `c` (see `saCtx()` in app.js) |
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
| `supabase/*.sql` | — | Database setup: `schema.sql`, then `002`…`017`, all already run on the live database |
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
| `#/admin` | Admin home or login |
| `#/admin/attendance`, `/attsum` | Attendance, attendance totals |
| `#/admin/points`, `/history` | Give points, points history (undo) |
| `#/admin/kids` | Kids list and editing |
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
| `#/admin/about` | Version number, grouped change log, Excel export of the change log |
| `#/admin/super` | Super admin page (only for an unlocked super admin session; otherwise the two-step screens) |

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
| `ya_c_lb`, `ya_c_pcats`, `ya_c_songs`, `ya_c_ev`, `ya_c_shop` | Last good answers for kid pages, used when offline or when the network takes over 6 s |

## 5. Database (Supabase)

To set up a new copy, run these files in the SQL editor in this order: `schema.sql`, `002`, `003` … `017`. After `017`, store the owner's email by hand (see 5b); it is not in the repo. Each one is safe to re-run.

### Tables

| Table | Columns (main) | Notes |
|---|---|---|
| `staff` | `user_id` (→ auth.users), `display_name`, `role` (`admin`/`editor`) | Adults allowed to edit. The first person can claim admin with `claim_admin()` |
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
| `audit_log` | `created_at`, `actor`, `actor_email`, `table_name`, `op`, `row_key`, `old_data`, `new_data` | Permanent: triggers `audit_log_no_change` and `audit_log_no_truncate` block changes |
| `kid_events` | `device_id`, `kid_id`, `event` (`^[a-z_]{1,40}$`), `detail` (≤120), `path` | Anyone can insert; staff can read |

### Views (public)

- **`leaderboard`:** `id`, `nickname`, `avatar`, `total`, `spent` (active kids only). `total` is the ranking score and never drops when a prize is given. Points to spend = `total − spent`.
- **`kid_skill_totals`:** `kid_id`, `skill`, `detail`, `total`.
- **`event_info`:** `event_dow`, `event_start`, `event_end`, `fb_dow`, `fb_start`, `fb_end`, `tip_days`, `fb_open`, `music`, `announce`, `verse_text`, `verse_ref`, `install_on`. Kids read the switches, the announcement, the verse and the install switch from here.

### Functions

| Function | What it does |
|---|---|
| `is_staff()`, `is_admin()` | Permission checks used by the security rules |
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
- **Staff:** full access to the working tables. Only the admin can update `settings`.
- **Storage bucket `images`:** public to view; only staff can upload, update or delete. Limit is 3 MB per file; types jpeg/png/webp/gif.

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
- **Super admin page (`#/admin/super`):** username and "until" time with a 🔒 Lock button; the kids' "Install as an app" switch; "Details for AI": fetches `HANDOFF.md`, checks its "current version" line against `VERSION`, shows it by section, and has "Copy as an AI prompt" (a short instruction header + the whole file) and "Download .md"; and a "Coming next" list.

### Running SQL from the browser (how it was done)

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
  - A new account shows "waiting for approval". The first ever user can claim admin.
- **Home** has grouped menus with red indicators for things to do:
  - **Super admin** (only when signed in as the unlocked super admin): Super admin page 👑
  - **Daily:** Attendance ✅, Points ⭐, Weekly summary 📊
  - **Kids:** Kids 👧, Feedback 💬, Announcement & verse 📣
  - **Rewards:** Point categories 🏷️, Shop 🎁, Give a prize 🎟️
  - **Songs:** Songs 🎵, Music switches 🎛️ (admin only)
  - **System:** Export 📥, Settings ⚙️ (admin only), Version & changes ℹ️ (the row shows the version number)

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
- **Point categories:** Thai and English name, icon (list, upload or type your own emoji), info text for kids, details list. Hide/show, delete (blocked if points use it).
- **Shop:** name, price and icon (list, upload or own emoji; special `chipbag`). Hide/show, delete.
- **Give a prize (redemption):**
  - Step 1: pick the kid (each row shows their points to spend). Step 2: pick the prize; prizes that cost too much are greyed out and say how many points are missing.
  - A confirmation names the prize, the kid, the price and what is left, and says ranking points do not change.
  - The list "prizes already given" has a **Give points back** button (named warning) that deletes the redemption.
  - The server checks the balance too (`redeem_check`).
- **Announcement & verse:** one short line (≤160 characters) for the top of the kids' home page, plus verse text and reference. Leave a field empty and save to hide it. The admin types the verse themselves.
- **Weekly summary** (last 7 days): points given, how many came to the last round, phones that opened the app, feedback count; kids who were not "present" in the last two attendance rounds (with each status); top 5 point gainers; most opened songs (from `song_open` events); prizes given.
- **Version & changes:** shows the version in use, the change log grouped into updates (Launch, Admin tools & data safety, Songs, Prizes & offline) with a coloured area tag on every item, an Excel export button, checks the live `js/version.js` to say whether this phone has the latest one (with an "Update now" button if not), and lists every version's changes.
- **Feedback:**
  - An on/off switch; turning it off shows a warning.
  - The list with mood, name or "anonymous", and time.
  - Hearts appear when there are new ones.
  - Export to Excel.
  - **QR card:** preview, plus "download poster" (a PNG with a Thai caption and the Youth Alpha title).
- **Music switches** (admin): turn each music feature on or off for every kid (stored in `settings.music`).
  - App: `bgMusic`, `songsTab`, `festive`, `festiveSfx`.
  - Song player: `lyrics`, `video`, `metro`, `beatDots`, `scroll`, `speed`, `beatSync`, `lineSync`, `chords`, `transpose`, `textSize`, `langSwitch`, `origSheet`.
- **Settings** (admin): tip frequency in days, and attendance points.
- **Export:**
  - One Excel file with all sheets, or one sheet at a time.
  - Sheets: summary (now with points spent and points to spend), points, attendance, attendance totals, feedback, prizes given, shop, admin log, kid activity, kid activity summary.
  - Times are in Thai time.
  - The admin log is turned into readable text by `describeLog`.
  - Also here: the **clear kids' activity log** button (admin, warning, password re-entry).

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

- **Admin log:** written automatically by database triggers on every insert, update or delete of the main tables, with old and new data and the admin's email. It is permanent. You can export it to Excel.
- **Kid activity:** `track()` events. No names are typed or stored; only the random device id, the chosen kid (if they tapped "this is me"), the event and a detail. Event names:
  - `open_app`, `view`, `tap_kid`, `tap_my_card`, `set_me`, `not_me`, `cat_info`
  - `shop_tap`, `bible_open`, `bible_link`, `theme_open`, `theme`, `lang`, `music`, `help_open`
  - `tour_next`, `tour_skip`, `tour_done`, `fb_pill`, `fb_open`, `fb_send`, `fb_qr`, `tree_tap`
  - `songs`, `song_open`, `metro`, `autoscroll`, `song_speed`, `transpose`, `yt_play`, `sheet_view`, `song_lang`
  - `credits`, `santa_tap`, `festive`, `pic_view`

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
- How: the Claude desktop app must be open; ask for access to `~/Desktop` with `device_request_folder_access` (granted on 2026-11-16 for that session). In `device_bash`: `git clone` the public repo into the session home (outside `mnt/`), then `cp -r` it (without `.git`) into `$HOME/mnt/Desktop/Youth Alpha/app` and copy `HANDOFF.md` next to it.
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
25. v25 (current), 2026-11-16: super admin "Miruku" with two-step sign-in (own password + emailed link, `017_superadmin.sql`), super admin page (install switch, "Details for AI" from HANDOFF.md with copy/download), AGENTS.md / CLAUDE.md rules for AIs, `songtext.js` and `superadmin.js` split out of app.js, login accepts 4-character passwords.

## 14. Ideas and open items

### Agreed plan (owner approved on 2026-11-16; build one release at a time, summary first, wait for "go")
- **v25 (super admin): DONE**, see 5b. Split of app.js started (songtext.js, superadmin.js); the rest of app.js (~1780 lines: kid pages, admin pages, song player) can be split further when touched.
- **v26 (programs):** each customised app is a saved "program" with its own look, settings, people, points, shop and songs, and **its own link**. One live program per link; today's data becomes program 1 "Youth Alpha Christmas 2026", untouched. Never delete existing data. A new program can copy the people list or the look from an old one. Named saved versions of a program's look as a safety net.
- **v27 (program settings, super admin only):** name, logo and wording, theme packs (Christmas, Easter, plain church), font and text size, feature switches.
- **v28:** drag-and-drop layout editor (reorder and show/hide sections, tabs and menu items, live preview; not a free-form designer).
- **v29:** Easter pack (3D scene from simple shapes, public-domain hymn, egg-hunt special mode, a mascot in place of Santa).
- **v30:** member login switch: real username + password accounts (future programs may be for adults), toggleable per program (off / personal details only / everything).
- **Also requested:** SQL export and data science tools for the super admin (separate release after the programs work).
- **Name:** stays "Youth Alpha" for now (no repo rename).
- **APK:** not built (see the install note in section 6); the owner chose the install option instead.


- The Thai words of the four Thai songs still need to be added by an admin, using Paste whole sheet or ✨ Read lyrics. Their chord-only lines are already there.
- Beat and line sync still need to be recorded per song in 🎯 Tap-along, if the owner wants karaoke on each song.
- Thai OCR sometimes drops vowel or tone marks on small or blurry pictures; a sharper photo helps.
- Unused tables (`money`, `schedule`, `shop_categories`) could be dropped later, but only if the owner agrees.
- Kid-side ideas the owner has seen but not asked for yet: prize goal with a progress bar, a "this week" ranking tab, badges, a countdown to the performance, a show mode for songs, looping one section of a video.
- Uploaded sheet pictures (Supabase Storage) are saved for offline through a CORS re-fetch. This was tested with CDN files; no song had an uploaded sheet at release time, so check it once one is uploaded.
