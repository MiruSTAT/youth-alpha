# Rules for any AI (or person) changing this app

Read **section 0 (Quick start) of `HANDOFF.md`** first. It has the current state, the next step, the owner's rules in short, the code map,
the tools and the release checklist. The rest of HANDOFF.md is reference: read only the sections a task needs.
The super admin page shows this same file to the owner as "Details for AI", so it must always be current.

## Every change you publish must also do all of this

1. **Version.** `tools/bump.sh <new>` raises `VERSION` in `js/version.js`, every `?v=` (index.html and every js import),
   `V` in `sw.js` and the HANDOFF.md version line together. New js files also go into `FILES` in `sw.js`.
2. **Change log** (`js/version.js` → `UPDATES`). Add the new version at the top of the newest update group
   (or start a new group). One item per change, in Thai **and** English, with an area
   (`kids | admin | songs | data | look | speed | safety | fix`). Say what changed, where it is in the app,
   and what it means for an admin. Give numbers when you measured something. Never edit or delete old items.
   Fill in the previous version's `commit` id.
3. **HANDOFF.md.** Update section 0 ("Now / Next / Still open") and every section your change touches, in detail:
   - section 4 (files, routes, localStorage keys), 5 (tables, views, functions, security rules),
     6–9 (features as the kids and the admins see them), 10 (how to release), 12 (gotchas you hit),
     13 (one history line for the version), 14 (plan and open items);
   - change the line "**The current version is `N`.**" to the new number. The super admin page compares
     it with the app's version and shows "Not updated" when they differ;
   - write for an AI that has never seen this chat: file names, function names, table and column names,
     what you decided and why, what you did not do and why, and what is still untested.
4. **Database changes** go in a new numbered file `supabase/0NN_name.sql` that is safe to re-run. Never put
   the owner's email, passwords or other private details in the repository (it is public).
5. **Test** with `tools/preview.sh <test names>` (preview copy + Playwright, see `tests/README.md`), add or update a
   test script in `tests/`, look at 1–2 screenshots, then check the live site after publishing.
   Database changes: rolled-back test on the live database first (`tools/sql.js`), then the real run.
6. **Owner's Desktop folder:** run `tools/desktop-copy.sh` on the owner's PC (device_bash) when the Claude desktop app
   is connected (HANDOFF.md section 0 and 10b).
7. **Tell the owner** in a few plain sentences what changed and what to check.

## The owner's standing rules (details in HANDOFF.md section 2)
- For a big change: give a short summary of what you will do and wait for "go".
- Simple, calm UI with big readable Thai text; no pop-up messages for kids.
- A clear warning that names the item before every delete. Feedback can never be deleted.
  The admin change log is permanent. Never delete existing data.
- Kids see only nickname, avatar and points.
- Don't type out copyrighted lyrics; admins paste or scan their own song sheets.

## Efficiency rules (the owner asked for these; they save usage without lowering quality)
- **Read little, search more.** HANDOFF.md section 0 first; then `grep -n` for headings / function names and read only
  that range (`Read` with offset/limit). Do not read whole big files (app.js ~2200 lines, HANDOFF.md ~750) "to be safe".
- **Never paste big files** into a message, a tool call or a browser call. Push them to a branch and fetch them from
  `raw.githubusercontent.com` (`tools/sql.js` → `QF`). Do not `Read`/`cat` generated files back after writing them.
- **Use the tools in `tools/`** instead of writing the same helpers again; if you need a new repeated helper, add it there
  and list it in HANDOFF.md section 0.
- **Edit precisely:** small `Edit`s or one short script per file; do not re-read a file just to check an edit worked.
- **Keep tool output short:** pipe long output through `tail`/`grep`; tests print only failures; take 1–2 screenshots
  of the changed screens (crop or scale them), not every page.
- **Long jobs** (tests ~2 min each): run with `run_in_background` and wait, instead of retrying with longer timeouts.
- **One roadmap step per chat.** When a step is released, update section 0 and give the owner a ready prompt for a new
  chat; a long chat re-sends everything said so far on every turn.
- **Plan once, then act:** before coding, list the files and functions you will touch (from the code map and `grep`),
  so you read only those.
